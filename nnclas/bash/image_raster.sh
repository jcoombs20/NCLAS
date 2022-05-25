#!/usr/bin/env bash

#echo $1
echo '<layer><defaultStyle><name>'"$2"'</name><workspace>nn-clas</workspace></defaultStyle></layer>'
#echo $3
#echo $4
#echo $5

####Raster layer
#Delete layer
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/layers/nn-clas:$1

#Delete coverage
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/workspaces/nn-clas/coveragestores/$1/coverages/$1

#Delete coverage store
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/workspaces/nn-clas/coveragestores/$1

#Add coverage store
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPOST -H "Content-type: text/xml" -d '<coverageStore><name>'"$1"'</name><type>GeoTIFF</type><enabled>true</enabled><workspace><name>nn-clas</name></workspace></coverageStore>' http://localhost:8080/geoserver/rest/workspaces/nn-clas/coveragestores/

#Add coverage
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPUT -H "Content-type: text/xml" -d "file://$5" http://localhost:8080/geoserver/rest/workspaces/nn-clas/coveragestores/$1/external.geotiff?configure=first&coverageName=$1

#Change style
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPUT -H 'Content-type: text/xml' -d '<layer><defaultStyle><name>'"$2"'</name><workspace>nn-clas</workspace></defaultStyle></layer>' http://localhost:8080/geoserver/rest/layers/nn-clas:$1

####Polygon layer
#Delete layer
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/layers/nn-clas:$3

#Delete featureType
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/workspaces/nn-clas/datastores/pg_images/featuretypes/$3

#Add layer
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPOST -H "Content-type: text/xml" -d "<featureType><name>$3</name></featureType>" http://localhost:8080/geoserver/rest/workspaces/nn-clas/datastores/pg_images/featuretypes

#Change style
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPUT -H 'Content-type: text/xml' -d '<layer><defaultStyle><name>'"$4"'</name><workspace>nn-clas</workspace></defaultStyle></layer>' http://localhost:8080/geoserver/rest/layers/nn-clas:$3

#Change raster style NOTE: Put it last because it wasn't working running directly after adding the coverage
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPUT -H 'Content-type: text/xml' -d '<layer><defaultStyle><name>'"$2"'</name><workspace>nn-clas</workspace></defaultStyle></layer>' http://localhost:8080/geoserver/rest/layers/nn-clas:$1
