all: bayes.min.js bayes.js
bayes.min.js: bayes.js
	uglifyjs bayes.js > bayes.min.js
bayes.js:  src/bayesnet.js src/bayesNode.js src/dsep.js src/inference.js
	cat ./src/dep/underscore-min.js >> bayes.js
	cat ./src/bayesnet.js >> bayes.js
	cat ./src/bayesNode.js >> bayes.js
	cat ./src/dsep.js >> bayes.js
	cat ./src/inference.js >> bayes.js
