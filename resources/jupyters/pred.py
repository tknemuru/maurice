from __future__ import print_function

from keras.models import load_model
import pandas as pd
from sklearn import preprocessing
import numpy

def pred(target):
  batch_size = 100

  model = load_model(f'model-{target}.h5', compile=False)

  x = pd.read_csv('~/dev/tknemuru/abel/resources/learnings/input.csv', header=None)
  print(x)
  x = preprocessing.scale(x)

  pred = model.predict(x, batch_size, verbose=0)
  print(pred)
  #numpy.savetxt(f'resources/pred-result-{target}.txt', pred)

pred('tan')