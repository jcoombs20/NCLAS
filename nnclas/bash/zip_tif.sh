#!/usr/bin/env bash

echo $1
echo $2

rm -f $1.zip

zip -mj $1.zip $1.* $1_unc.*
zip -j $1.zip $2
ln -s -f "$1.zip" /home/jason/views/NCLAS/nnclas/zips
