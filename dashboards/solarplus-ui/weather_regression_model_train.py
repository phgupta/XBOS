from sklearn.linear_model import LinearRegression
from sklearn import model_selection
import numpy as np
import pandas as pd
import pickle

def createDataTable():
	"""
	createDataTable()

	Creates data table by parsing the csv files for Air temperature and power generated data

	Returns
	-------
	pandas dataframe
    The dataframe required to train the regression model.
	"""
	df_temperature =pd.read_csv('./solarplus-ui/Historic_microgrid_data/AirTemperatureData.csv')
	df_PVPower = pd.read_csv('./solarplus-ui/Historic_microgrid_data/PVPowerGenData.csv')

	# eliminating all entries except for the ones in the time range 
	# we are looking from 14th march to 24th april 2018
	# 2018-03-14 -> 2018-04-24
	startDate = "2018-03-14"
	endDate = "2018-04-24"

	# For temperature data
	# This gets all the entries of the specific start date and end date
	startDateEntries_temperature = df_temperature[df_temperature['Date_PT'].str.contains(startDate)]
	endDateEntries_temperature = df_temperature[df_temperature['Date_PT'].str.contains(endDate)]

    # finding the first index of start date entries and last index of the end date entries
    # so that we can get the range of indices for the data in the specified timeframe
	startDateIndex_temperature = startDateEntries_temperature.index[0]
	endDateIndex_temperature = endDateEntries_temperature.index[-1]

    #fetching data in the specific timeframe
	dataInRange_temperature = df_temperature[startDateIndex_temperature:(endDateIndex_temperature+1)]

	# Repeating the same process for PVPower Data
	startDateEntries_power = df_PVPower[df_PVPower['Date_PT'].str.contains(startDate)]
	endDateEntries_power = df_PVPower[df_PVPower['Date_PT'].str.contains(endDate)]
	startDateIndex_power = startDateEntries_power.index[0]
	endDateIndex_power = endDateEntries_power.index[-1]
	dataInRange_power = df_PVPower[startDateIndex_power:(endDateIndex_power+1)]

	nextEntryIndex_power = df_PVPower.index[0]
	df_model = pd.DataFrame() #creating an epty dataframe that feeds to model
	df_model = pd.DataFrame(columns=['AirTemp_degC_Max', 'PVPower_kW_Sum'])

	
	#having a while loop that runs till the power dataframe is empty
	while not dataInRange_power.empty:
		# getting the date of the entry we want to deal with
		currDateEntry = dataInRange_power.iloc[nextEntryIndex_power].Date_PT
		currDate = (currDateEntry.split(' '))[0]
		print(currDateEntry)

		#obtaining max temperature of a day
		currDateEntries_temperature = dataInRange_temperature[dataInRange_temperature['Date_PT'].str.contains(currDate)].AirTemp_degC
		currDateEntriesTempMax = max(currDateEntries_temperature)

		#obtaining sum power production of a day
		currDateEntries_power = dataInRange_power[dataInRange_power['Date_PT'].str.contains(currDate)].PVPower_kW
		currDateEntriesPowerSum = sum(currDateEntries_power)

		df_model.loc[len(df_model)] = [currDateEntriesTempMax, currDateEntriesPowerSum]

		dataInRange_power = dataInRange_power[~dataInRange_power.Date_PT.str.contains(currDate)]

		# bug when the dataframe reaches 24th April - 16th March entry still exists in the dataframe, so exit the
		# loop for now when creating the data matrix for rlstm
		if "04-24" in currDate:
			break

		# finding the next date to perform the same operations on, as long as the dataframe is not alraedy empty
		if not dataInRange_power.empty:
			nextEntryIndex_power = dataInRange_power.index[0]
	
	return df_model

def regression_model():
	"""
	regression_model()

	Creates the regression model, trains it, and saves the model
	
	"""

	#fetching the data table
	df_temperature_power = createDataTable()

	# Format of x values in model always has to be [[] [] []] where there is one column and multiple rows
	# Hence the reshape function has to be used to allow this 
	temperature_xvals = np.array(df_temperature_power['AirTemp_degC_Max']).reshape((-1, 1))
	power_yvals = np.array(df_temperature_power['PVPower_kW_Sum'])

	# Performing a train-test split to predict accuracy
	seed = 7
	X_train, X_test, Y_train, Y_test = model_selection.train_test_split(temperature_xvals, power_yvals, 
											test_size=0.05, random_state=seed)
	model = LinearRegression()
	model.fit(X_train, Y_train)
	result = model.score(X_test, Y_test)
	print("train and test split accuracy = ", result)


	# creating linear regression model and training all data values with fit()
	# X-values are the maximum temperature of the day, Y-values are the sum of power production
	linear_model = LinearRegression()
	linear_model.fit(temperature_xvals,power_yvals)
	print('intercept:', linear_model.intercept_)
	print('slope:', linear_model.coef_)

	# saving the trained model
	filename = 'trained_model.sav'
	pickle.dump(linear_model, open(filename, 'wb'))

	# small test value
	x_pred = [[17]]
	y_pred = linear_model.predict(x_pred)

	print("y-values = ", y_pred)


#test function
def test():

	filename = 'trained_model.sav'
	loaded_model = pickle.load(open(filename, 'rb'))

	X_pred = [[17],[15],[11],[9], [10]]
	Y_pred =  loaded_model.predict(X_pred)

	print(X_pred)
	print(Y_pred)

#quick test
test()
