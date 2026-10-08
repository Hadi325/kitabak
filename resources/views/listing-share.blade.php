<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ $book->title }} - Kitabak</title>

    <meta
        name="description"
        content="{{ $book->title }} available on Kitabak."
    >

    {{-- Open Graph: Facebook, WhatsApp, etc. --}}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Kitabak">
    <meta property="og:title" content="{{ $book->title }} - Kitabak">
    <meta
        property="og:description"
        content="{{ $book->title }} available on Kitabak."
    >
    <meta property="og:url" content="{{ $shareUrl }}">

    @if ($imageUrl)
        <meta property="og:image" content="{{ $imageUrl }}">
        <meta property="og:image:alt" content="{{ $book->title }}">
    @endif

    {{-- Useful for platforms that support Twitter/X-style cards --}}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{ $book->title }} - Kitabak">
    <meta
        name="twitter:description"
        content="{{ $book->title }} available on Kitabak."
    >

    @if ($imageUrl)
        <meta name="twitter:image" content="{{ $imageUrl }}">
    @endif

    <link
        rel="canonical"
        href="{{ $shareUrl }}"
    >


</head>

<body>
    <p>
        <a href="{{ $listingUrl }}">
            View {{ $book->title }} on Kitabak
        </a>
    </p>

    <script>
        window.location.replace(@json($listingUrl));
    </script>
</body>
</html>