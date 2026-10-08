<?php

$runs = [
    [0, 1], [2, 1], [4, 3], [8, 2], [13, 1], [16, 1], [18, 1], [21, 3],
    [25, 4], [30, 1], [32, 1], [35, 3], [39, 1], [41, 4], [46, 1], [48, 1],
    [50, 1], [52, 3], [57, 3], [62, 1], [64, 1], [66, 1], [71, 2], [75, 2],
    [78, 1], [81, 3], [85, 1], [89, 1], [92, 1], [94, 1],
];

$image = imagecreatetruecolor(1150, 700);
$white = imagecolorallocate($image, 255, 255, 255);
$black = imagecolorallocate($image, 0, 0, 0);
imagefill($image, 0, 0, $white);

foreach ($runs as [$start, $width]) {
    imagefilledrectangle(
        $image,
        (10 + $start) * 10,
        50,
        (10 + $start + $width) * 10 - 1,
        549,
        $black,
    );
}

imagestring($image, 5, 500, 610, '9 780306 406157', $black);

$output = dirname(__DIR__).'/public/test-assets/isbn-9780306406157.png';
imagepng($image, $output);

echo "Generated {$output}".PHP_EOL;
