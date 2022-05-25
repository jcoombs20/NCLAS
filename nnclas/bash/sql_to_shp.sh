#!/usr/bin/env bash

#echo $1
#echo $2
#echo $3

rm -f $1.*
pgsql2shp -f $1 -h localhost -p 5432 -u Jason -P Jason20! nn-clas "$2"

zip -mj $1.zip $1.*
zip -j $1.zip $3
ln -s -f "$1.zip" /home/jason/views/NCLAS/nnclas/zips
