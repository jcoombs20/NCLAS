#!/usr/bin/env bash

#echo $1
#echo '<layer><defaultStyle><name>'"$2"'</name><workspace>nn-clas</workspace></defaultStyle></layer>'
#echo $3
#echo $4

####Raster layer
#Delete layer
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/layers/nn-clas:L_EXC_Trich_N_2012_class1_Yosemite_NP

#Delete coverage
#curl -o /dev/null -s -w "%{http_code}\n" -v -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/layers/nn-clas:A_class1_Selway-Bitterroot%20Wilderness
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/workspaces/nn-clas/coveragestores/Lichen_Test/coverages/L_EXC_Trich_N_2012_class1_Yosemite_NP

#Delete coverage store
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/workspaces/nn-clas/coveragestores/Lichen_Test

#Add coverage store
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPOST -H "Content-type: text/xml" -d "<coverageStore><name>Lichen_Test</name><type>GeoTIFF</type><enabled>true</enabled><workspace><name>nn-clas</name></workspace></coverageStore>" http://localhost:8080/geoserver/rest/workspaces/nn-clas/coveragestores/

#Add coverage
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPUT -H "Content-type: text/xml" -d "file:///data_cl/nn-clas/zip_files/L_EXC_Trich_N_2012_class1_Yosemite_NP.tif" http://localhost:8080/geoserver/rest/workspaces/nn-clas/coveragestores/Lichen_Test/external.geotiff?configure=first&coverageName=Lichen_Test

#Change style
#curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPUT -H 'Content-type: text/xml' -d '<layer><defaultStyle><name>L_EXC_type1</name><workspace>nn-clas</workspace></defaultStyle></layer>' http://localhost:8080/geoserver/rest/layers/nn-clas:L_EXC_Trich_N_2012_class1_Yosemite_NP

####Polygon layer
#Delete layer
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/layers/nn-clas:$3

#Delete featureType
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XDELETE http://localhost:8080/geoserver/rest/workspaces/nn-clas/datastores/pg_images/featuretypes/$3

#Add layer
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPOST -H "Content-type: text/xml" -d "<featureType><name>$3</name></featureType>" http://localhost:8080/geoserver/rest/workspaces/nn-clas/datastores/pg_images/featuretypes

#Change style
curl -o /dev/null -s -w "%{http_code}\n" -u admin:pickle^of32permissions -XPUT -H 'Content-type: text/xml' -d '<layer><defaultStyle><name>'"$4"'</name><workspace>nn-clas</workspace></defaultStyle></layer>' http://localhost:8080/geoserver/rest/layers/nn-clas:$3
