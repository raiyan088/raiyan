<?php

$date = new DateTime('now', new DateTimezone('Asia/Dhaka'));

echo $date->format('g:i A');

?>