#!/bin/bash
# Comment line

#declare -a sppLong=("Thuja_occidentalis" "Tsuga_canadensis" "Ulmus_americana")
declare -a sppLong=("Abies_balsamea" "Acer_rubrum" "Acer_saccharum" "Betula_alleghaniensis" "Betula_papyrifera" "Castanea_dentata" "Fagus_grandifolia" "Fraxinus_americana" "Fraxinus_pennsylvanica" "Juglans_cinerea" "Picea_mariana" "Picea_rubens" "Pinus_resinosa" "Pinus_rigida" "Pinus_strobus" "Populus_grandidentata" "Populus_tremuloides" "Quercus_alba" "Quercus_prinus" "Quercus_rubra" "Thuja_occidentalis" "Tsuga_canadensis" "Ulmus_americana")

#declare -a sppShort=("th_oc" "ts_ca" "ul_am")
declare -a sppShort=("ab_ba" "ac_ru" "ac_sa" "be_al" "be_pa" "ca_de" "fa_gr" "fr_am" "fr_pe" "ju_ci" "pi_ma" "pi_ru" "pi_re" "pi_ri" "pi_st" "po_gr" "po_tr" "qu_al" "qu_pr" "qu_ru" "th_oc" "ts_ca" "ul_am")

#declare -a fileNames=("_cl_mins" "_exc_mins" "_exc_maxs")
declare -a fileNames=("_range")

sppLength=${#sppLong[@]}
echo $sppLength

for (( i=0; i<${sppLength}; i++ ));
do
  for partFile in "${fileNames[@]}"
  do
    #7z a "/data_cl/species/"${sppLong[$i]}"/"${sppShort[$i]}$partFile".zip" "/data_cl/species/"${sppLong[$i]}"/"${sppShort[$i]}$partFile".tif"
    ln -sv "/data_cl/species/"${sppLong[$i]}"/"${sppShort[$i]}$partFile".zip" "/home/jason/views/NCLAS/zips/"${sppShort[$i]}$partFile".zip"
  done
done