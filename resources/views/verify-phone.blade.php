<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify Phone</title>
</head>
<body>
    <h1>Verify your phone</h1>
    @if(session('status') === 'verification-code-sent')
        <p style="color:green">A new verification code was sent.</p>
    @endif

    @if($errors->any())
        <div style="color:red">
            <ul>
                @foreach($errors->all() as $err)
                    <li>{{ $err }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <p>We sent a 6-digit verification code to: <strong>{{ $phone ?? '' }}</strong></p>

    <form method="POST" action="{{ route('phone.verify') }}">
        @csrf
        <label for="code">Verification Code</label>
        <input id="code" name="code" required />
        <button type="submit">Verify</button>
    </form>

    <form method="POST" action="{{ route('phone.verify.resend') }}" style="margin-top:1em">
        @csrf
        <button type="submit">Resend Code</button>
    </form>

    <p>If you did not receive the code, check the application log (laravel.log) for the test code while you configure an SMS provider.</p>
</body>
</html>