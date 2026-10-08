<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Throwable;

class LocationController extends Controller
{
    public function reverse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],
            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],
        ]);

        $latitude = (float) $validated['latitude'];
        $longitude = (float) $validated['longitude'];

        /*
         * Fast preliminary check for Lebanon.
         * The provider's country code performs the final check.
         */
        if (
            $latitude < 33.0 ||
            $latitude > 34.8 ||
            $longitude < 35.0 ||
            $longitude > 36.7
        ) {
            return response()->json([
                'supported' => false,
                'area' => null,
            ]);
        }

        $apiKey = config('services.geoapify.key');

        if (blank($apiKey)) {
            return response()->json([
                'message' =>
                    'The location service is not configured.',
            ], 503);
        }

        try {
            $response = Http::acceptJson()
                ->timeout(8)
                ->retry(2, 200)
                ->get(
                    'https://api.geoapify.com/v1/geocode/reverse',
                    [
                        'lat' => $latitude,
                        'lon' => $longitude,
                        'format' => 'json',
                        'lang' => 'en',
                        'apiKey' => $apiKey,
                    ],
                );

            if ($response->failed()) {
                return response()->json([
                    'message' =>
                        'The location could not be identified.',
                ], 503);
            }

            $location = data_get(
                $response->json(),
                'results.0',
            );

            if (! is_array($location)) {
                return response()->json([
                    'supported' => false,
                    'area' => null,
                ]);
            }

            /*
             * Final validation: only locations whose country
             * code is Lebanon (LB) are accepted.
             */
            if (
                strtolower(
                    (string) ($location['country_code'] ?? ''),
                ) !== 'lb'
            ) {
                return response()->json([
                    'supported' => false,
                    'area' => null,
                ]);
            }

            /*
             * Select the most precise Lebanese area.
             * Never return the country name.
             */
            $area = null;

            foreach ([
                'suburb',
                'district',
                'city',
                'town',
                'village',
                'municipality',
                'county',
                'state',
            ] as $field) {
                if (filled($location[$field] ?? null)) {
                    $area = trim(
                        (string) $location[$field],
                    );

                    break;
                }
            }

            if (
                blank($area) ||
                strtolower($area) === 'lebanon'
            ) {
                return response()->json([
                    'supported' => false,
                    'area' => null,
                ]);
            }

            return response()->json([
                'supported' => true,
                'area' => $area,
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' =>
                    'The location service is temporarily unavailable.',
            ], 503);
        }
    }
    public function search(Request $request): JsonResponse
{
    $validated = $request->validate([
        'q' => [
            'required',
            'string',
            'min:2',
            'max:100',
        ],
    ]);

    $query = trim($validated['q']);

    $apiKey = config('services.geoapify.key');

    if (blank($apiKey)) {
        return response()->json([
            'message' =>
                'The location service is not configured.',
        ], 503);
    }

    try {
        $response = Http::acceptJson()
            ->timeout(8)
            ->retry(2, 200)
            ->get(
                'https://api.geoapify.com/v1/geocode/autocomplete',
                [
                    'text' => $query,
                    'filter' => 'countrycode:lb',
                    'bias' => 'countrycode:lb',
                    'format' => 'json',
                    'lang' => 'en',
                    'limit' => 8,
                    'apiKey' => $apiKey,
                ],
            );

        if ($response->failed()) {
            return response()->json([
                'message' =>
                    'The location search is temporarily unavailable.',
            ], 503);
        }

        $results = collect(
            $response->json('results', []),
        )
            ->filter(function ($location) {
                return strtolower(
                    (string) ($location['country_code'] ?? ''),
                ) === 'lb';
            })
            ->map(function ($location) {
                $area = null;

                foreach ([
                    'suburb',
                    'district',
                    'city',
                    'town',
                    'village',
                    'municipality',
                    'county',
                    'state',
                ] as $field) {
                    if (filled($location[$field] ?? null)) {
                        $area = trim(
                            (string) $location[$field],
                        );

                        break;
                    }
                }

                if (
                    blank($area) ||
                    strtolower($area) === 'lebanon'
                ) {
                    return null;
                }

                $context = collect([
                    $location['city'] ?? null,
                    $location['county'] ?? null,
                    $location['state'] ?? null,
                ])
                    ->filter()
                    ->map(
                        fn ($value) =>
                            trim((string) $value),
                    )
                    ->reject(
                        fn ($value) =>
                            strcasecmp($value, $area) === 0 ||
                            strcasecmp($value, 'Lebanon') === 0,
                    )
                    ->unique()
                    ->values()
                    ->take(2)
                    ->implode(', ');

                return [
                    'area' => $area,
                    'label' => $context
                        ? "{$area}, {$context}"
                        : $area,
                ];
            })
            ->filter()
            ->unique(
                fn ($item) =>
                    mb_strtolower($item['label']),
            )
            ->values()
            ->take(8);

        return response()->json([
            'results' => $results,
        ]);
    } catch (Throwable $exception) {
        report($exception);

        return response()->json([
            'message' =>
                'The location search is temporarily unavailable.',
        ], 503);
    }
}
}