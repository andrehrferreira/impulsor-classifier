Impulsor - @impulsor/classifier

Pacote de funcionalidade para classificação de ofertas em categorias e 
produtos únicos usando como base taxonomia da B2W, categorias 
e ofertas da Americanas.com, abaixo a lista de funcionalidade:

* Criação de lista de categorias base pelo script importCategories.js (requer taxonomy.B2W.pt-BR.txt)
* Importação blocos de imagens para treinamento do machine learning pelo script importImagesCategories.js
* Treinamento de machine learning para criação de datasets no formato Mobilenet pelo script trainMultiDataset.js
* Classificação por image e breadcrumb pelo script testDatasetMulti.js

# Rebuild Node + Tensorflow 

Para utilizar a funções de marchine leaning será necessário o rebuild do core do Node,
para isso basta rodar o comando abaixo:

```bash
$ npm rebuild @tensorflow/tfjs-node build-addon-from-source
```

# Baixando Mobilenet

Para realizar o treinamento usando o script trainMultiDataset.js ou trainSingleDataset.js, será necessário baixar o modelo Mobilenet para TensorflowJS

```bash
$ cd ./data/mobilenet && mobilenet.sh
```

ou

```bash
$ cd ./data/mobilenet
$ wget "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json"
$ cat model.json | jq -r ".weightsManifest[].paths[0]" | sed 's/^/https:\/\/storage.googleapis.com\/tfjs-models\/tfjs\/mobilenet_v1_1.0_224\//' |  parallel curl -O
```

## Importação de categorias base

Este processo não possui obrigatoriedade para a classificação, somente deve ser feito 
no banco que irá utilizar como eferencia os Ids das categorias, ou para exportação.

```bash
$ yarn script importCategories.js
```

## Criando base de imagens para treino

Este processo e fundamental para criar o dataset que será utilizado pelo serviço para classificação por 
imagem, obviamente por se tratar de mais de 5.000 mil categorias e por padrão o algoritmo baixa 200 imagens
por categoria este processo pode demorar a ser finalizado.

```bash
$ yarn script importImagesCategories.js
$ yarn script reOrderTrain.js
```

Após finalizar o processo de download das imagens por categoria, e preciso iniciar o treinamento do dataset para 
classificação, por se tratar de uma aprendizado de maquina com grande volume de dados novamente este processo 
irá demorar para ser finalizado.

```bash
$ yarn script trainMultiDataset.js
```

O processo de treino irá finalizar com a criação dos arquivos de dataset em /data/dataset,
estes arquivos podem ser compatados e distrubidos para uso na classificação sem necessidade de
repetir os processos acima.