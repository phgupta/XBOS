from flask import Flask
from flask import jsonify, send_from_directory
from flask import request
from flask import current_app
from flask import make_response
from flask import render_template
from flask_pymongo import PyMongo

import xsg
import pymortar
import pandas as pd
import pendulum
import toml
import pytz
import json
import glob
import os
from bson import json_util
from collections import defaultdict
from functools import update_wrapper
from datetime import datetime, timedelta
from dashutil import get_start, generate_months, prevmonday, get_today

app = Flask(__name__, static_url_path='/static')

config = toml.load('config.toml')
TZ = pytz.timezone('US/Pacific')
client = pymortar.Client({
    'mortar_address': config['Mortar']['url'],
    'username': config['Mortar']['username'],
    'password': config['Mortar']['password'],
})
sites = [config['Dashboard']['sitename']]

# MongoDB configurations
app.config['MONGO_DBNAME'] = 'modes'
app.config["MONGO_URI"] = "mongodb://localhost:27017/modes"
mongo = PyMongo(app)

# Push default modes to mongodb once script starts
INITIALIZED = False


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


def state_to_string(state):
    if state == 0:
        return 'off'
    elif state == 1:
        return 'heat stage 1'
    elif state == 2:
        return 'cool stage 1'
    elif state == 4:
        return 'heat stage 2'
    elif state == 5:
        return 'cool stage 2'
    else:
        return 'unknown'


def dofetch(views, dataframes, start=None, end=None):
    timeparams = None
    if start is not None and end is not None:
        timeparams=pymortar.TimeParams(
            start=start.isoformat(),
            end=end.isoformat(),
        )
    req = pymortar.FetchRequest(
        sites=sites,
        views=views,
        dataFrames=dataframes,
        time=timeparams
    )

    return client.fetch(req)

meter_view = pymortar.View(
        name="meters",
        definition="""SELECT ?meter WHERE {
            ?meter rdf:type brick:Building_Electric_Meter
        };""",
    )
meter_df = pymortar.DataFrame(
        name="meters",
        aggregation=pymortar.MEAN,
        timeseries=[
            pymortar.Timeseries(
                view="meters",
                dataVars=['?meter'],
            )
        ]
    )

tstats_view = pymortar.View(
    name="tstats",
    definition="""SELECT ?rtu ?zone ?tstat ?csp ?hsp ?temp ?state WHERE {
      ?rtu rdf:type brick:RTU .
      ?tstat bf:controls ?rtu .
      ?rtu bf:feeds ?zone .
      ?tstat bf:hasPoint ?temp .
      ?temp rdf:type/rdfs:subClassOf* brick:Temperature_Sensor .

      ?tstat bf:hasPoint ?csp .
      ?csp rdf:type/rdfs:subClassOf* brick:Supply_Air_Temperature_Heating_Setpoint .

      ?tstat bf:hasPoint ?hsp .
      ?hsp rdf:type/rdfs:subClassOf* brick:Supply_Air_Temperature_Cooling_Setpoint .

      ?tstat bf:hasPoint ?state .
      ?state rdf:type brick:Thermostat_Status .
    };""",
)

tstats_df = pymortar.DataFrame(
    name="tstats",
    aggregation=pymortar.MAX,
    timeseries=[
        pymortar.Timeseries(
            view="tstats",
            dataVars=['?csp','?hsp','?temp','?state'],
        ),
    ]
)

room_temp_view = pymortar.View(
    name="room_temp",
    definition="""SELECT ?zone ?room ?sensor WHERE {
        ?zone rdf:type brick:HVAC_Zone .
        ?zone bf:hasPart ?room .
        ?sensor rdf:type/rdfs:subClassOf* brick:Temperature_Sensor .
        ?room bf:hasPoint ?sensor  .
    };""",
)

weather_view = pymortar.View(
    name="weather_temp",
    definition="""SELECT ?sensor WHERE {
    ?sensor rdf:type/rdfs:subClassOf* brick:Weather_Temperature_Sensor .
    };""",
)

weather_df = pymortar.DataFrame(
    name="weather_temp",
    aggregation=pymortar.MEAN,
    window='15m',
    timeseries=[
        pymortar.Timeseries(
            view="weather_temp",
            dataVars=['?sensor'],
        )
    ],
)


# Home page is requesting /api/power/day/in/15m
@app.route('/api/power/<last>/in/<bucketsize>')
@crossdomain(origin='*')
def power_summary(last, bucketsize):
    # first, determine the start date from the 'last' argument
    start_date = get_start(last)
    if last == 'year' and bucketsize == 'month':
        ranges = generate_months(get_today().month - 1)
        readings = []
        times = []
        for t0, t1 in ranges:
            meter_df.window = '{0}d'.format((t0-t1).days)
            res = dofetch([meter_view], [meter_df], t1, t0)
            times.append(t1.tz_convert(TZ).timestamp()*1000)
            readings.append(res['meters'].fillna('myNullVal').values[0][0])

        # print('power_summary(): ', dict(zip(times, readings)))
        return jsonify({'readings': dict(zip(times, readings))})

    # otherwise,
    meter_df.window = bucketsize
    print('start_date',  start_date)
    res = dofetch([meter_view], [meter_df], start_date, datetime.now(TZ))
    # print('res: \n', res['meters'])
    res['meters'].columns = ['readings']
    # print('power_summary(): ', res['meters'].tz_convert(TZ).fillna('myNullVal'))
    return res['meters'].tz_convert(TZ).fillna('myNullVal').to_json()


# Home page is requesting /api/energy/year/in/month & /api/energy/month/in/1d
@app.route('/api/energy/<last>/in/<bucketsize>')
@crossdomain(origin='*')
def energy_summary(last, bucketsize):

    start_date = get_start(last)
    if last == 'year' and bucketsize == 'month':
        ranges = generate_months(get_today().month - 1)
        readings = []
        times = []
        for t0, t1 in ranges:
            meter_df.window = '15m'
            res = dofetch([meter_view], [meter_df], t1, t0)
            df = res['meters'].copy()
            df.columns = ['readings']
            df /= 4.  # divide by 4 to get 15min (kW) -> kWh
            times.append(pd.to_datetime(t1.isoformat()))
            readings.append(df['readings'].sum())
        df = pd.DataFrame(readings, index=times, columns=['readings'])
        # print('\n/api/energy/year/in/month/ df: \n', df)
        return df.fillna('myNullVal').to_json()

    meter_df.window = '15m'
    print('start_date',start_date)
    res = dofetch([meter_view], [meter_df], start_date, datetime.now(TZ))
    df = res['meters'].tz_convert(TZ).copy()
    df.columns = ['readings']
    df['readings'] /= 4.
    return df.fillna('myNullVal').resample(bucketsize).apply(sum).to_json()


@app.route('/api/price')
@crossdomain(origin='*')
def price():
    res = xsg.get_price(sites[0], get_today(), get_today()+timedelta(days=1))
    return res['price'].to_json()


@app.route('/api/power')
@crossdomain(origin='*')
def current_power():
    raise(Exception("/api/power NOT IMPLEMENTED"))
    pass


@app.route('/api/hvac')
@crossdomain(origin='*')
def hvacstate():
    t1 = datetime.now(TZ).replace(microsecond=0)
    t0 = t1 - timedelta(hours=12)
    tstats_df.window='1h'
    res = dofetch([tstats_view, room_temp_view], [tstats_df], t0, t1)
    zones = defaultdict(lambda : defaultdict(dict))
    for (tstat, zone, hsp, csp, temp, state) in res.query('select tstat, zone, hsp_uuid, csp_uuid, temp_uuid, state_uuid from tstats'):
        zone = zone.split('#')[-1]
        tempdf = res['tstats'][[hsp,csp,temp,state]].tail(1).fillna('myNullVal')
        hsp,csp,temp,state = tempdf.values[-1]
        zones[zone]['heating_setpoint'] = hsp
        zones[zone]['cooling_setpoint'] = csp
        zones[zone]['tstat_temperature'] = temp
        zones[zone]['heating'] = bool(state == 1  or state == 4)
        zones[zone]['cooling'] = bool(state == 2 or state == 5)
        zones[zone]['timestamp'] = tempdf.index[-1].timestamp() * 1000

    return jsonify(zones)


@app.route('/api/hvac/day/in/<bucketsize>')
@crossdomain(origin='*')
def serve_historipcal_hvac(bucketsize):
    t1 = datetime.now(TZ).replace(microsecond=0)
    t0 = get_today()
    tstats_df.window=bucketsize
    res = dofetch([tstats_view, weather_view], [tstats_df, weather_df], t0, t1)
    zones = defaultdict(lambda : defaultdict(dict))
    df = res['tstats'].fillna(method='ffill').fillna(method='bfill')
    for (tstat, zone, hsp, csp, temp, state) in res.query('select tstat, zone, hsp_uuid, csp_uuid, temp_uuid, state_uuid from tstats'):
        zone = zone.split('#')[-1]
        zones[zone]['inside'] = json.loads(df[temp].dropna().to_json())
        zones[zone]['heating'] = json.loads(df[hsp].dropna().to_json())
        zones[zone]['outside'] = json.loads(res['weather_temp'].max(axis=1).dropna().to_json())
        zones[zone]['cooling'] = json.loads(df[csp].dropna().to_json())
        zones[zone]['state'] = json.loads(df[state].dropna().apply(state_to_string).to_json())
        for k, values in zones[zone].items():
            if len(values) == 0:
                fakedates = pd.date_range(t0, t1, freq=bucketsize.replace('m','T'))
                if k != 'state':
                    fakevals = [0]*len(fakedates)
                else:
                    fakevals = ['off']*len(fakedates)
                zones[zone][k] = json.loads(pd.DataFrame(fakevals,index=fakedates)[0].to_json())
    return jsonify(zones)


@app.route('/api/hvac/day/<bucketsize>')
@crossdomain(origin='*')
def get_temp_per_zone(bucketsize):
    t1 = datetime.now(TZ).replace(microsecond=0)
    t0 = get_today()
    tstats_df.window=bucketsize
    res = dofetch([tstats_view, weather_view], [tstats_df, weather_df], t0, t1)
    zones = defaultdict(lambda : defaultdict(dict))
    df = res['tstats']
    for (zone, temp) in res.query('select zone, temp_uuid from tstats'):
        zone = zone.split('#')[-1]
        zones[zone] = json.loads(df[temp].fillna('myNullVal').to_json())
    return jsonify(zones)


@app.route('/api/prediction/hvac/day/in/<bucketsize>')
@crossdomain(origin='*')
def serve_prediction_hvac(bucketsize):
    pass


@app.route('/api/prediction/dr')
@crossdomain(origin='*')
def serve_prediction_dr():
    return jsonify({'days': [{'date': 1558126800, 'likelihood': 'likely'}]})


def format_simulation_output(output):
    # actions -> number to label
    for zone, data in output.items():
        data['state'] = {int(t/1e6): state_to_string(v) for t,v in data.pop('actions').items()}
        data['inside'] = {int(t/1e6): v for t,v in data.pop('temperatures').items()}
        data['outside'] = {t: 30 for t in data['inside'].keys()}
        data['cooling'] = {t: 30 for t in data['inside'].keys()}
        data['heating'] = {t: 30 for t in data['inside'].keys()}
        output[zone] = data
    return output


@app.route('/api/simulation/<drlambda>/<date>')
def simulate_lambda_site(drlambda, date):
    ret = {}
    for zone in xsg.get_zones(sites[0]):
        start = pendulum.parse(date, tz='US/Pacific')
        # TODO: change back to 12
        end = start.add(hours=1)
        fmt = '%Y-%m-%dT%H:%M:%S%z'
        start = datetime.strptime(start.strftime(fmt), fmt)
        end = datetime.strptime(end.strftime(fmt), fmt)

        try:
            # print('sites[0]: ', sites[0])
            # print('start: ', start)
            # print('end: ', end)
            # print('float(drlambda): ', float(drlambda))
            # print('zone: ', zone)
            res = xsg.simulation(sites[0], start, end, '1h', float(drlambda), zone=zone)
            # dataframe to dict
            formatted = {k: df.set_index(df.index.astype(int)).to_dict() for k, df in res.items()}
            ret.update(formatted)
            print(formatted)
            #return jsonify(formatted)
        except Exception as e:
            return jsonify({'error': 'could not get prediction', 'msg': str(e)})
    print(ret)
    return jsonify(format_simulation_output(ret))


@app.route('/api/simulation/<drlambda>/<date>/<zone>')
@crossdomain(origin='*')
def simulate_lambda(drlambda, date, zone):
    """
    TODO: do we assume that the lambda is for the peak period only: 4-7pm
        how do we do this on the backend?
    assume date is in YYYY-MM-DD
    """
    print(xsg.get_zones(sites[0]))

    start = pendulum.parse(date, tz='US/Pacific')
    end = start.add(hours=24)
    fmt = '%Y-%m-%dT%H:%M:%S%z'
    start = datetime.strptime(start.strftime(fmt), fmt)
    end = datetime.strptime(end.strftime(fmt), fmt)

    try:
        res = xsg.simulation(sites[0], start, end, '1h', float(drlambda), zone=zone)
        # dataframe to dict
        d = {k: df.set_index(df.index.astype(int)).to_dict() for k, df in res.items()}
        return jsonify(format_simulation_output(d))
    except Exception as e:
       return jsonify({'error': 'could not get prediction', 'msg': str(e)})


@app.route('/api/occupancy/<last>/in/<bucketsize>')
@crossdomain(origin='*')
def serve_occupancy(last, bucketsize):
    pass

#@app.route('/api/hvac/day/setpoints')
#@crossdomain(origin='*')
#def setpoint_today():
#    pass


@app.route('/svg/<filename>')
@crossdomain(origin='*')
def getsvg(filename):
    supported_files = glob.glob('static/svg/*.svg')
    if filename in map(os.path.basename, supported_files):
        with open(f'static/svg/{filename}') as f:
            return f.read()
    return jsonify({'error': f'no svg by name of {filename}'})


@app.route('/<filename>')
@crossdomain(origin='*')
def home(filename):
    return send_from_directory('templates', filename)
    #return render_template('index.html')


@app.route('/')
@crossdomain(origin='*')
def index():

    global INITIALIZED

    # When the scripts run for the first time, add default modes in mongodb
    if not INITIALIZED:
        default_modes = {
            'type': 'modes',
            'data': [
                {'id': 0, 'name': "Closed", 'heating': "55", 'cooling': "85", 'enabled': True},
                {'id': 1, 'name': "Open", 'heating': "70", 'cooling': "75", 'enabled': False},
                {'id': 2, 'name': "Do Not Exceed", 'heating': "52", 'cooling': "83", 'enabled': True},
                {'id': 3, 'name': "Other", 'heating': "51", 'cooling': "84", 'enabled': True},
                {'id': 4, 'name': "Midnight", 'heating': "54", 'cooling': "88", 'enabled': False},
                {'id': 5, 'name': "Early Morn", 'heating': "50", 'cooling': "80", 'enabled': True}
            ]
        }

        try:
            mongo.db.modes.insert_one(default_modes)
            INITIALIZED = True
            print('Successfully pushed default modes to MongoDB.')
        except Exception as e:
            return jsonify({'error': str(e)})

    return render_template('index.html')


@app.route('/api/save_modes', methods=['POST'])
@crossdomain(origin="*")
def save_modes():
    """ Saves the modes (closed, open...) in schedule-groups.js page. """

    # Convert bytes to dict
    data = request.data                     # class <'bytes'>
    str_data = data.decode('utf-8')         # str
    json_data = json.loads(str_data)        # list(dict)

    res = {}
    res['type'] = 'modes'
    res['data'] = json_data

    try:
        # res is of type bson (binary json)
        mongo.db.modes.insert_one(res)
        return jsonify({'success': str_data})
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/api/get_modes')
@crossdomain(origin="*")
def get_modes():
    """ This function retrieves the settings & times for a particular group in "Schedule" tab. """

    # Get the record which stores all the modes i.e. type=modes
    result = mongo.db.modes.find({'type': 'modes'})

    # CHECK: result will always return a cursor object?
    if result:
        for doc in result:
            doc = json.loads(json_util.dumps(doc))
            return jsonify(doc["data"])
    else:
        return jsonify({'error': 'could not retrieve data from mongodb'})


@app.route('/api/create_grouping', methods=['POST'])
@crossdomain(origin="*")
def create_grouping():
    """ Create new group. """

    # Convert bytes to dict
    print("shalom")
    data = request.data                 # class <'bytes'>
    str_data = data.decode('utf-8')     # str
    json_data = json.loads(str_data)    # dict
    json_data['type'] = 'groups'        # Differentiates groups from modes

    try:
        # result is of type bson (binary json)
        mongo.db.modes.insert_one(json_data)
        return jsonify({'success': str_data})
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/api/update_grouping', methods=['POST'])
@crossdomain(origin="*")
def update_grouping():
    """ Update a group's name, settings, times... """

    # Convert bytes to dict
    data = request.data                     # class <'bytes'>
    str_data = data.decode('utf-8')         # str
    orig_json_data = json.loads(str_data)   # dict
    orig_json_data['type'] = 'groups'       # Differentiates groups from modes

    # For updating, query db by the original group name.
    # When updating the db, delete the original group name attribute since every record
    # has only one attribute regarding group name, i.e. "group".
    new_json_data = orig_json_data.copy()
    del new_json_data['original_group_name']

    try:
        mongo.db.modes.update(
            {
                '$and': [
                    {'type': 'groups'},
                    {'group': orig_json_data['original_group_name']}
                ]
            },
            {
                '$set': new_json_data
            }
        )
        return jsonify({'success': str_data})
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/api/get_groupings')
@crossdomain(origin="*")
def get_groupings():
    """ Retrieve all groups for the building. """
    print("shalom from get_groupings")

    # Get all groups of building
    result = mongo.db.modes.find({'type': 'groups'})

    # CHECK: result will always return a cursor object?
    if result:
        groupings = []
        for doc in result:
            doc = json.loads(json_util.dumps(doc))
            groupings.append(doc)
        print("shalom again!")
        print(groupings)
        return jsonify(groupings)
    else:
        return jsonify({'error': 'could not retrieve data from mongodb'})

@app.route('/api/delete_grouping', methods=['POST'])
@crossdomain(origin="*")
def delete_grouping():
    """ Delete group from mongodb. """

    # Convert bytes to dict
    data = request.data                     # class <'bytes'>
    str_data = data.decode('utf-8')         # str
    json_data = json.loads(str_data)        # dict
    # json_data['type'] = 'groups'            # Differentiates groups from modes
    print(json_data)

    try:
        mongo.db.modes.delete_one(
            {
                '$and': [
                    {'type': 'groups'},
                    {'group': json_data}
                ]
            }
        )
        return jsonify({'success': json_data})
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/api/get_zones')
@crossdomain(origin="*")
def get_zones():
    """ This function retrieves all the zone names of a building """
    zones = xsg.get_zones(sites[0])
    if isinstance(zones, list) and len(zones) > 0:
        # print("brandon", json.dumps(zones).replace("\"", "'"), "berookhim")
        return jsonify(zones)
    else:
        return jsonify({'error': 'couldn\'t retrieve zones'})

def get_all_db():
    """ Helper function to get all documents in mongodb """

    result = mongo.db.modes.find({})

    if result:
        groupings = []
        for doc in result:
            doc = json.loads(json_util.dumps(doc))
            groupings.append(doc)
        print(groupings)
    else:
        print('Error')


def delete_all_db():
    """ Helper function to delete all documents in mongodb """

    result = mongo.db.modes.remove({})
    if result:
        print('Success')
    else:
        print('Error')

    result = mongo.db.modes.find({})
    if result:
        groupings = []
        for doc in result:
            doc = json.loads(json_util.dumps(doc))
            groupings.append(doc)
        print(groupings)
    else:
        print('Error')


if __name__ == '__main__':

    get_all_db()
    # delete_all_db()
    app.run(host='0.0.0.0', debug=True)
