<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify your email</title>
    <link href="/css/app.css" rel="stylesheet">
</head>
<body class="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200">
        <div class="px-8 py-10">
            <h2 class="text-2xl font-serif font-semibold text-gray-900 mb-4">Verify your email</h2>

            @if(session('status') === 'verification-code-sent')
                <div class="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
                    A new verification code was sent to your email.
                </div>
            @endif

            @if($errors->any())
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
                    <ul class="list-disc pl-5">
                        @foreach($errors->all() as $err)
                            <li>{{ $err }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <p class="text-gray-700 mb-6">We sent a 6-digit verification code to: <span class="font-medium">{{ $email ?? '' }}</span></p>

            <form method="POST" action="{{ route('email.verify') }}" class="space-y-4">
                @csrf

                <div>
                    <label for="code" class="block text-sm font-medium text-gray-700">Verification Code</label>
                    <div class="mt-1">
                        <input id="code" name="code" type="text" inputmode="numeric" pattern="\d{6}" maxlength="6" required
                               class="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <button type="submit" class="inline-flex items-center px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md text-sm font-medium">Verify</button>

                    <form method="POST" action="{{ route('email.verify.resend') }}">
                        @csrf
                        <button type="submit" class="text-sm text-indigo-600 hover:underline">Resend Code</button>
                    </form>
                </div>
            </form>

            <p class="text-xs text-gray-500 mt-6">If you did not receive the code, check your spam folder or the application log (laravel.log) for the test code while you configure mail delivery.</p>

        </div>
    </div>
</body>
</html>