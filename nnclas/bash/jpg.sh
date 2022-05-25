#!/usr/bin/env bash

echo $1

convert $1_area_raster.png $1.png -gravity center -compose over -composite $1_merged.png
convert $1_merged.png -background white -flatten -alpha off $1.jpg

ln -s -f "$1.jpg" /home/jason/views/NCLAS/nnclas/jpgs
