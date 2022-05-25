#!/usr/bin/env bash

#echo $1
#echo '<layer><defaultStyle><name>'"$2"'</name><workspace>nn-clas</workspace></defaultStyle></layer>'
#echo $3
#echo $4
#echo $5

####Point layer
#Delete layer
#curl -o /dev/null -s -w "%{http_code}\n" -v -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/layers/nn-clas:A_class1_Selway-Bitterroot%20Wilderness
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/layers/nn-clas:$1


#Delete featureType
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/workspaces/nn-clas/datastores/pg_images/featuretypes/$1

#Add layer
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPOST -H "Content-type: text/xml" -d "<featureType><name>$1</name><nativeName>$5</nativeName></featureType>" http://localhost:8080/geoserver/rest/workspaces/nn-clas/datastores/pg_images/featuretypes

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
