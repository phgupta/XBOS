# main.py
from flask import Flask, request, send_from_directory, json
import config
from flask import make_response, request, current_app
from flask import jsonify, redirect, url_for
from flask import g, render_template, url_for, session
from influxdb import InfluxDBClient
import boto3
import boto.ses
import base64
from urllib.request import urlopen

from datetime import timedelta
from functools import update_wrapper
import pandas as pd
import datetime
from flask_oidc import OpenIDConnect
from okta import UsersClient

from sklearn.linear_model import LinearRegression
from sklearn import model_selection
import pickle
import numpy as np
from json import dumps
from flask import Blueprint, render_template
from flask_login import login_required, current_user

AWS_ACCESS_KEY = config.aws_access_key
AWS_SECRET_KEY = config.aws_secret_key


admin = [3]

main = Blueprint('main', __name__)

class Email(object):
        def __init__(self, to, subject):
            self.to = to
            self.subject = subject
            self._html = None
            self._text = None
            self._format = 'html'

        def html(self, html):
            self._html = html

        def text(self, text):
            self._text = text

        def send(self, from_addr=None):
            body = self._html

            if isinstance(self.to, str):
                self.to = [self.to]
            if not from_addr:
                from_addr = 'webwizards193@gmail.com'
            if not self._html and not self._text:
                raise Exception('You must provide a text or html body.')
            if not self._html:
                self._format = 'text'
                body = self._text

            connection = boto.ses.connect_to_region(
                'us-west-2',
                aws_access_key_id=AWS_ACCESS_KEY,
                aws_secret_access_key=AWS_SECRET_KEY
            )

            return connection.send_email(
                from_addr,
                self.subject,
                None,
                self.to,
                format=self._format,
                text_body=self._text,
                html_body=self._html
            )

# Create an SNS client
client = boto3.client(
"sns",
aws_access_key_id=AWS_ACCESS_KEY,
aws_secret_access_key=AWS_SECRET_KEY,
region_name="us-west-2"
)


# @main.route('/')
# def index():
#     return render_template('landing.html')

# @main.route('/profile')
# @login_required
# def profile():
#     return render_template('profile.html', name=current_user.name)

@main.route("/")
def landing():
    """
    Render the landing page.
    """
    return render_template('landing.html')


@main.route("/dashboard")
@login_required
def dashboard():
    """
    Render the dashboard page.
    """
    return render_template("dashboard.html",name=current_user.name, admin = admin, id = current_user.id)

@main.route("/setpoints")
@login_required
def setpoints():
    """
    Render the setpoints page.
    """

    # create the client for influxdb
    client = InfluxDBClient('127.0.0.1', 8086,'setpoints_db')
    client.switch_database('setpoints_db')

    queryTemp1 = client.query('SELECT "Thermostat1_HSP" from temperature ORDER BY DESC LIMIT 1')
    points1 = queryTemp1.get_points()
    for item in points1:
            result1 = item['Thermostat1_HSP']

    queryTemp2 = client.query('SELECT "Thermostat1_CSP" from temperature ORDER BY DESC LIMIT 1')
    points2 = queryTemp2.get_points()
    for item in points2:
            result2 = item['Thermostat1_CSP']

    queryTemp3 = client.query('SELECT "Thermostat2_HSP" from temperature ORDER BY DESC LIMIT 1')
    points3 = queryTemp3.get_points()
    for item in points3:
            result3 = item['Thermostat2_HSP']

    queryTemp4 = client.query('SELECT "Thermostat2_CSP" from temperature ORDER BY DESC LIMIT 1')
    points4 = queryTemp4.get_points()
    for item in points4:
            result4 = item['Thermostat2_CSP']

    queryTemp5 = client.query('SELECT "Refrigerator_SP" from temperature ORDER BY DESC LIMIT 1')
    points5 = queryTemp5.get_points()
    for item in points5:
            result5 = item['Refrigerator_SP']

    queryTemp6 = client.query('SELECT "Refrigerator_SP+dT" from temperature ORDER BY DESC LIMIT 1')
    points6 = queryTemp6.get_points()
    for item in points6:
            result6 = item['Refrigerator_SP+dT']

    queryTemp7 = client.query('SELECT "Freezer_SP" from temperature ORDER BY DESC LIMIT 1')
    points7 = queryTemp7.get_points()
    for item in points7:
            result7 = item['Freezer_SP']

    queryTemp8 = client.query('SELECT "Freezer_SP+dT" from temperature ORDER BY DESC LIMIT 1')
    points8 = queryTemp8.get_points()
    for item in points8:
            result8 = item['Freezer_SP+dT']

    if current_user.id in admin:
        return render_template("setpoints.html",temperature1=result1,temperature2=result2,
                                temperature3=result3,temperature4=result4,temperature5=result5,
                                temperature6=result6,temperature7=result7,temperature8=result8,
                                name=current_user.name)
    else:
        return render_template('404.html'), 404

@main.route("/weather")
@login_required
def weather():
    """
    Render the weather page.
    """
    return render_template("weather.html",name=current_user.name, admin = admin, id = current_user.id)

@main.route("/analysis")
@login_required
def analysis():
    """
    Render the weather page.
    """
    if current_user.id in admin:
        return render_template("analysis.html",name=current_user.name)
    else:
        return render_template('404.html'), 404

@main.route("/DR")
@login_required
def dr():
    """
    Render the DR page.
    """
    return render_template("DR.html",name=current_user.name)

@main.route("/intelligence")
@login_required
def intelligence():
    """
    Render the intelligence page.
    """
    if current_user.id in admin:
        return render_template("intelligence.html",name=current_user.name)
    else:
        return render_template('404.html'), 404

@main.route("/contact")
@login_required
def contact():
    """
    Render the intelligence page.
    """
    return render_template("contact.html",name=current_user.name, admin = admin, id = current_user.id, email= current_user.email)

@main.route("/profile")
@login_required
def profile():
    """
    Render the intelligence page.
    """
    return render_template("profile.html",name=current_user.name,email=current_user.email,id=current_user.id)

@main.errorhandler(404)
def page_not_found(e):
    # note that we set the 404 status explicitly
    return render_template('404.html'), 404




@main.route('/aws', methods=['POST'])
def aws():
    # Send your sms message.
    response = request.get_json()
    print(response)
    print(response["name"])
    print(response["email"])
    print(response["number"])
    print(response["message"])
    client.publish(
    PhoneNumber="+1" + str(response["number"]),
    Message="Hi, " + str(response["name"]) + ": Your Solarplus Issue Ticket has been received!  Thank you! :)"
    )

    email = Email(to='webwizards193@gmail.com', subject='New Issue Ticket Posted!')
    email.text('This is a text body. Foo bar.')
    email.html('<html><body>''Dear Admin <br>' + str(response["name"]) + ' says:<br>' + '<strong>' + str(response["message"]) +'</strong> </body></html>')  # Optional
    email.send()

    return jsonify({"message": "done"})

def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, str):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, str):
        origin = ', '.join(origin)
    if isinstance(max_age, timedelta):
        max_age = max_age.total_seconds()

    def get_methods():
        if methods is not None:
            return methods

        options_resp = current_app.make_default_options_response()
        return options_resp.headers['allow']

    def decorator(f):
        def wrapped_function(*args, **kwargs):
            if automatic_options and request.method == 'OPTIONS':
                resp = current_app.make_default_options_response()
            else:
                resp = make_response(f(*args, **kwargs))
            if not attach_to_all and request.method != 'OPTIONS':
                return resp

            h = resp.headers

            h['Access-Control-Allow-Origin'] = origin
            h['Access-Control-Allow-Methods'] = get_methods()
            h['Access-Control-Max-Age'] = str(max_age)
            if headers is not None:
                h['Access-Control-Allow-Headers'] = headers
            return resp

        f.provide_automatic_options = False
        return update_wrapper(wrapped_function, f)
    return decorator


@main.route('/cieeData')
@crossdomain(origin="*")
def cieeData():
    ciee = pd.read_csv("./sample_data/ciee.csv")
    ciee.columns = ['TimeStamp', 'ciee', 's0', 's1', 's2', 's3']

    #limiting to 20 entries
    ciee = ciee[:20]

    return ciee.to_json(orient='records')


@main.route('/cieeData/<startDate>/<endDate>')
@crossdomain(origin="*")
def extractData(startDate, endDate):
    """

    Not used in the project anymore
    Extracts data using start date and end date

    """
    cieeDF = pd.read_csv("./sample_data/ciee.csv")
    cieeDF.columns = ['TimeStamp', 'ciee', 's0', 's1', 's2', 's3']

    # check for validity of range of dates
    startYear,startMonth,startDay=[int(x) for x in startDate.split('-')]
    endYear,endMonth,endDay=[int(x) for x in endDate.split('-')]

    if(datetime.datetime(startYear,startMonth,startDay) > datetime.datetime(endYear,endMonth,endDay)):
        print ('Wrong range of dates given. Start Date = ' ,startDate, "; End Date = ", endDate)
        return 'Incorrect Range of dates'

    # This gets all the entries of the specific start date and end date
    startDateEntries = cieeDF[cieeDF['TimeStamp'].str.contains(startDate)]
    endDateEntries = cieeDF[cieeDF['TimeStamp'].str.contains(endDate)]

    # finding the first index of start date entries and last index of the end date entries
    # so that we can get the range of indices for the data in the specified timeframe
    startDateIndex = startDateEntries.index[0]
    endDateIndex = endDateEntries.index[-1]

    #fetching data in the specific timeframe
    dataInRange = cieeDF[startDateIndex:(endDateIndex+1)]

    return dataInRange.to_json(orient = 'records')


@main.route('/<filename>/<startDate>/<endDate>/<feature1>/<feature2>')
@crossdomain(origin="*")
def extractData_plotTwoQueries(filename, startDate, endDate, feature1, feature2):

    """
    Not used in the project anymore
    extractData_plotTwoQueries(filename, startDate, endDate, feature1, feature2)

    Parameters
    ----------
    filename: str,
    startDate: str (formatted as yyyy-mm-dd),
    endDate: str (formatted as yyyy-mm-dd),
    feature1: str,
    feature2: str

    This function takes in a file name, start and end date with the two features that
    the user wants plotted on the graph

    Returns
    -------
    JSON object
    pandas dataframe that is converted to JSON object to hold the data of dates and 2 features' values
    """

    filePathString = "./solarplus_sample_data/" + filename+".csv"
    print(filePathString)
    readDF = pd.read_csv(filePathString)

    '''The names the columns of the data frame using the first row info - assumes that column names
     are entered correctly in the csv files - which is why the column names are not renamed in this
     function. '''

    # check for validity of range of dates
    startYear,startMonth,startDay=[int(x) for x in startDate.split('-')]
    endYear,endMonth,endDay=[int(x) for x in endDate.split('-')]

    if(datetime.datetime(startYear,startMonth,startDay) > datetime.datetime(endYear,endMonth,endDay)):
        print ('Wrong range of dates given. Start Date = ' ,startDate, "; End Date = ", endDate)
        return 'Incorrect Range of dates'


    # This gets all the entries of the specific start date and end date
    startDateEntries = readDF[readDF['Time'].str.contains(startDate)]
    endDateEntries = readDF[readDF['Time'].str.contains(endDate)]

    # finding the first index of start date entries and last index of the end date entries
    # so that we can get the range of indices for the data in the specified timeframe
    startDateIndex = startDateEntries.index[0]
    endDateIndex = endDateEntries.index[-1]

    #fetching data in the specific timeframe
    dataInRange = readDF[startDateIndex:(endDateIndex+1)]

    dataInRange = dataInRange.loc[:,['Time', feature1, feature2]]

    return dataInRange.to_json(orient = 'records')

@main.route('/setpoints/getEntry1', methods = ['POST'])
def renderFirstRow1():
    content = request.get_json(silent=False, force=True)
    Thermostat1_HSP = content['temp1']
    Thermostat1_CSP = content['temp2']
    Thermostat2_HSP = content['temp3']
    Thermostat2_CSP = content['temp4']


    # inserting data into the database
    client = InfluxDBClient('127.0.0.1', 8086, 'setpoints_db')
    client.switch_database('setpoints_db')

    json_body = [{
        'tags': {
            'User':'username'
            },
        'fields': {
            'Thermostat1_HSP': Thermostat1_HSP,
            'Thermostat1_CSP': Thermostat1_CSP,
            'Thermostat2_HSP': Thermostat2_HSP,
            'Thermostat2_CSP': Thermostat2_CSP
            },
        'measurement': 'temperature'
        }]

    client.write_points(json_body)

    return


@main.route('/setpoints/getEntry2', methods = ['POST'])
def renderFirstRow2():
    content = request.get_json(silent=False, force=True)
    Refrigerator_SP = content['temp5']
    Refrigerator_SP_Plus_dT = content['temp6']
    Freezer_SP = content['temp7']
    Freezer_SP_Plus_dT = content['temp8']

    client = InfluxDBClient('127.0.0.1', 8086, 'setpoints_db')
    client.switch_database('setpoints_db')

    json_body = [{
        'tags': {
            'User':'username'
            },
        'fields': {
            'Refrigerator_SP': Refrigerator_SP,
            'Refrigerator_SP+dT': Refrigerator_SP_Plus_dT,
            'Freezer_SP': Freezer_SP,
            'Freezer_SP+dT': Freezer_SP_Plus_dT
            },
        'measurement': 'temperature'
        }]

    client.write_points(json_body)

    return


@main.route('/analysis/MLModel/<day1>/<day2>/<day3>/<day4>/<day5>/<day6>/<day7>')
@crossdomain(origin="*")
def MLPredictionModel(day1, day2, day3, day4, day5, day6, day7):

    """
    MLPredictionModel(day1, day2, day3, day4, day5, day6, day7)

    Parameters
    ----------
    day1 : str
    day2 : str
    day3 : str
    day4 : str
    day5 : str
    day6 : str
    day7 : str

    The function predicts the solar power generated given the temperatures of different days

    Returns
    -------
    JSON object
    pandas dataframe that is converted to JSON object to hold the data of dates and predicted values
    """

    filename = './solarplus-ui/trained_model.sav'
    loaded_model = pickle.load(open(filename, 'rb'))

    X_pred = [[float(day1)],[float(day2)],[float(day3)],[float(day4)],[float(day5)],[float(day6)],[float(day7)]]
    Y_pred =  loaded_model.predict(X_pred)

    print(X_pred)
    print(Y_pred)

    X_pred=[float(day1), float(day2), float(day3), float(day4), float(day5), float(day6), float(day7)]
    dataset = pd.DataFrame({'X_pred': X_pred, 'Column1':Y_pred})

    return dataset.to_json(orient = 'records')


@main.route('/dashboard/access/<feature1>')
@crossdomain(origin="*")
def extractData_oneFeature_Control2(feature1):

    """
    extractData_oneFeature_Control2(feature1)

    Parameters
    ----------
    feature1 : str

    This function extracts data for any feature's data from Control.csv data
    of the solarplus sample data -> will be used for total power consumption
    values for dashboard

    Returns
    -------
    JSON object
    pandas dataframe that is converted to JSON object to hold the data of dates and feature1 values
    """
    filePathString = "./solarplus-ui/solarplus_sample_data/Control2.csv"
    readDF = pd.read_csv(filePathString)

    df = readDF.loc[:,['Time',feature1]]
    return df.to_json(orient = 'records')


@main.route('/dashboard/access/<feature1>/<feature2>')
@crossdomain(origin="*")
def extractData_twoFeatures_Control2(feature1, feature2):
    """

    Parameters
    ----------
    feature1 : str
    feature2 : str

    This function extracts data for any 2 features' data from Control.csv data
    of the solarplus sample data -> will be used for HVAC1 and HVAC2
    values for dashboard

    Returns
    -------
    JSON object
    pandas dataframe that is converted to JSON object to hold the data of dates and feature1 and feature2 values
    """
    filePathString = "./solarplus-ui/solarplus_sample_data/Control2.csv"
    readDF = pd.read_csv(filePathString)

    df = readDF.loc[:,['Time',feature1,feature2]]
    return df.to_json(orient = 'records')

@main.route('/dashboard/PVPowerGenData')
@crossdomain(origin="*")
def extractData_PVPowerGenData():
    """
    extractData_PVPowerGenData()

    This function extracts data for solar production values from

    """
    filePathString = "./solarplus-ui/Historic_microgrid_data/PVPowerGenData.csv"
    readDF = pd.read_csv(filePathString)

    df = readDF.loc[:,['Date_PT','PVPower_kW']]
    return df.to_json(orient = 'records')


@main.route('/dashboard/access/<feature1>/average')
@crossdomain(origin="*")
def extractData_oneFeature_Control3(feature1):
    """
    extractData_oneFeature_Control3(feature1)

    Parameters
    ----------
    feature1 : str

    This function extracts data for any feature's data from Control.csv data
    of the solarplus sample data -> will be used for average power consumption
    values

    Returns
    -------
    JSON object
    pandas dataframe that is converted to JSON object to hold the data of dates and average values
    """
    filePathString = "./solarplus-ui/solarplus_sample_data/Control2.csv"
    readDF = pd.read_csv(filePathString)

    df = readDF.loc[:,['Time',feature1]]

    # loop here to go through the dataframe and calculate the average
    nextEntryIndex = df.index[0]
    df_model = pd.DataFrame() #creating an epty dataframe that feeds to model
    df_model = pd.DataFrame(columns=['Time', feature1])

	#having a while loop that runs till the power dataframe is empty since that is shorter
    while not df.empty:
        # getting the date of the entry we want to deal with
        currDateEntry = df.iloc[nextEntryIndex].Time
        currDate = (currDateEntry.split(' '))[0]
        print(currDateEntry)

        #obtaining average power production of a day
        currDateEntries_power = df[df['Time'].str.contains(currDate)].Building
        currDateEntriesPowerAverage = sum(currDateEntries_power)/len(currDateEntries_power)
        df_model.loc[len(df_model)] = [currDate, currDateEntriesPowerAverage]

        df = df[~df.Time.str.contains(currDate)]
        # finding the next date to perform the same operations on, as long as the dataframe is not alraedy empty
        if not df.empty:
            nextEntryIndex_power = df.index[0]

    return df_model.to_json(orient = 'records')
