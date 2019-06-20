from flask import Flask
from flask import abort
from flask import Response
from flask import render_template
from flask import request
from flask import current_app
from flask import make_response
from flask import jsonify
from flask_basicauth import BasicAuth
from collections import defaultdict
from itertools import groupby
from dateutil.relativedelta import relativedelta
from datetime import datetime, date, timedelta
from functools import update_wrapper
import pandas as pd
import pytz
import msgpack
import os
import json
import hvactest
import occupancy
import drprediction

from xbos import get_client
from xbos.services import hod, mdal

SITE = 'ciee'
# SITE = 'jesse-turner-center'
# SITE = 'orinda-community-center'
# SITE = 'jesse-turner-center'
OURTZ=pytz.timezone("US/Pacific")

import config

def crossdomain(origin=None, methods=None, headers=None,
                max_age=21600, attach_to_all=True,
                automatic_options=True):
    if methods is not None:
        methods = ', '.join(sorted(x.upper() for x in methods))
    if headers is not None and not isinstance(headers, basestring):
        headers = ', '.join(x.upper() for x in headers)
    if not isinstance(origin, basestring):
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

def get_today():
    d = datetime.now(config.TZ)
    return config.TZ.localize(datetime(year=d.year, month=d.month, day=d.day))

def prevmonday(num):
    """
    Return unix SECOND timestamp of "num" mondays ago
    """
    today = get_today()
    lastmonday = today - timedelta(days=today.weekday(), weeks=num)
    return lastmonday

def get_start(last):
    today = get_today()
    if last == 'year':
        dt = datetime(year=today.year, month=1, day=1)
    elif last == 'month':
        dt = datetime(year=today.year, month=today.month, day=1)
    elif last == 'week':
        dt = datetime(year=today.year, month=today.month, day=today.day-today.weekday())
    elif last == 'day':
        dt = datetime(year=today.year, month=today.month, day=today.day)
    elif last == 'hour':
        dt = datetime(year=today.year, month=today.month, day=today.day, hour=datetime.now().hour)
    else:
        dt = datetime(year=today.year, month=today.month, day=today.day, hour=datetime.now().hour)
    return config.TZ.localize(dt)

def generate_months(lastN):
    firstDayThisMonth = get_today().replace(day=1)
    ranges = [[get_today(), firstDayThisMonth]]
    lastN = int(lastN)
    while lastN > 0:
        firstDayLastMonth = firstDayThisMonth - relativedelta(months=1)
        ranges.append([firstDayThisMonth - timedelta(days=1) + timedelta(hours=1), firstDayLastMonth])
        firstDayThisMonth = firstDayLastMonth
        lastN -= 1
    return ranges


c = get_client(config.AGENT, config.ENTITY)

app = Flask(__name__, static_url_path='')

@app.route('/api/power/<last>/in/<bucketsize>')
@crossdomain(origin="*")
def power_summary(last, bucketsize):
    # first, determine the start date from the 'last' argument
    start_date = get_start(last)
    if last == 'year' and bucketsize == 'month':
        ranges = generate_months(get_today().month - 1)

        readings = []
        times = []
        for t0,t1 in ranges:
            query = {
                "Composition": ["meter"],
                "Selectors": [mdal.MEAN],
                "Variables": [
                    {"Name": "meter",
                     "Definition": "SELECT ?meter_uuid FROM %s WHERE { ?meter rdf:type brick:Building_Electric_Meter . ?meter bf:uuid ?meter_uuid };" % config.SITE,
                     "Units": "kW"}
                ],
                "Time": {
                    "T0": t0.strftime("%Y-%m-%d %H:%M:%S %Z"),
                    "T1": t1.strftime("%Y-%m-%d %H:%M:%S %Z"),
                    "WindowSize": '{0}d'.format((t0-t1).days),
                    "Aligned": True
                },
            }
            print query
            resp = config.MDAL.do_query(query, timeout=60)
            if 'error' in resp:
                print 'ERROR', resp
                abort(500)
                abort(Response(status=resp['error']))
                return
            else:
                resp['df'].columns = ['readings']
            t1_ = t1.strptime(t1.strftime("%Y-%m-%d"), '%Y-%m-%d')
            times.append(config.TZ.localize(t1_))
            readings.append(resp['df']['readings'][0])
        print zip(times,readings)
        df = pd.DataFrame(readings,index=times)
        df.columns = ['readings']
        return df.fillna("myNullVal").to_json()

    query = {
        "Composition": ["meter"],
        "Selectors": [mdal.MEAN],
        "Variables": [
            {"Name": "meter",
             "Definition": "SELECT ?meter_uuid FROM %s WHERE { ?meter rdf:type brick:Building_Electric_Meter . ?meter bf:uuid ?meter_uuid };" % config.SITE,
             "Units": "kW"}
        ],
        "Time": {
            "T0": start_date.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "T1": datetime.now(config.TZ).strftime("%Y-%m-%d %H:%M:%S %Z"),#(monday + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S"),
            "WindowSize": bucketsize,
            "Aligned": True
        },
    }
    print query
    resp = config.MDAL.do_query(query, timeout=60)
    if 'error' in resp:
        print 'ERROR', resp
        abort(500)
        abort(Response(status=resp['error']))
        return
    else:
        resp['df'].columns = ['readings']
        return resp['df'].fillna("myNullVal").to_json()
    return "ok"

@app.route('/api/energy/<last>/in/<bucketsize>')
@crossdomain(origin="*")
def energy_summary(last, bucketsize):
    # first, determine the start date from the 'last' argument
    start_date = get_start(last)
    if last == 'year' and bucketsize == 'month':
        ranges = generate_months(get_today().month - 1)

        readings = []
        times = []
        for t0,t1 in ranges:
            query = {
                "Composition": ["meter"],
                "Selectors": [mdal.MEAN],
                "Variables": [
                    {"Name": "meter",
                     "Definition": "SELECT ?meter_uuid FROM %s WHERE { ?meter rdf:type brick:Building_Electric_Meter . ?meter bf:uuid ?meter_uuid };" % config.SITE,
                     "Units": "kW"}
                ],
                "Time": {
                    "T0": t0.strftime("%Y-%m-%d %H:%M:%S %Z"),
                    "T1": t1.strftime("%Y-%m-%d %H:%M:%S %Z"),
                    "WindowSize": '15m',
                    "Aligned": True
                },
            }
            print query
            resp = config.MDAL.do_query(query, timeout=60)
            if 'error' in resp:
                print 'ERROR', resp
                abort(500)
                abort(Response(status=resp['error']))
                return
            else:
                resp['df'].columns = ['readings']
                resp['df'].columns = ['readings'] # in k@
                resp['df']['readings']/=4. # divide by 4 to get 15min (kW) -> kWh
                t1_ = t1.strptime(t1.strftime("%Y-%m-%d"), '%Y-%m-%d')
                times.append(config.TZ.localize(t1_))
                readings.append(resp['df']['readings'].sum())
        df = pd.DataFrame(readings,index=times)
        return df.fillna("myNullVal").to_json()
    print start_date
    query = {
        "Composition": ["meter"],
        "Selectors": [mdal.MEAN],
        "Variables": [
            {"Name": "meter",
             "Definition": "SELECT ?meter_uuid FROM %s WHERE { ?meter rdf:type brick:Building_Electric_Meter . ?meter bf:uuid ?meter_uuid };" % config.SITE,
             "Units": "kW"}
        ],
        "Time": {
            "T0": start_date.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "T1": datetime.now(config.TZ).strftime("%Y-%m-%d %H:%M:%S %Z"),#(monday + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S"),
            "WindowSize": '15m',
            "Aligned": True
        },
    }
    print query
    resp = config.MDAL.do_query(query, timeout=60)
    if 'error' in resp:
        print 'ERROR', resp
        abort(500)
        abort(Response(status=resp['error']))
        return
    else:
        resp['df'].columns = ['readings'] # in k@
        resp['df']['readings']/=4. # divide by 4 to get 15min (kW) -> kWh
        return resp['df'].fillna("myNullVal").resample(bucketsize).apply(sum).to_json()
    return "ok"

@app.route('/api/power')
@crossdomain(origin="*")
def price():
    # TODO: retrieve this from config
    price_signal = {"readings": {
        "1530550800000": .13,
    }}
    return jsonify(price_signal)

@app.route('/api/power')
@crossdomain(origin="*")
def current_power():
    resp = config.HOD.do_query("SELECT ?meter_uri FROM %s WHERE { ?meter rdf:type brick:Building_Electric_Meter . ?meter bf:uri ?meter_uri };" % config.SITE)
    if resp['Count'] > 0:
        uri = resp['Rows'][0]['?meter_uri']+'/signal/meter'
        h = c.query(uri)
        if len(h) == 0:
            abort(500)
            abort(Response(status='NO RESPONSE from ' + uri))
            return
        if len(h[0].payload_objects) == 0:
            abort(500)
            abort(Response(status='NO data from ' + uri))
            return
        status = msgpack.unpackb(h[0].payload_objects[0].content)
        if status is None:
            abort(500)
            abort(Response(status='Could not decode data from' + uri))
            return
        return jsonify({'demand': status['current_demand']})
    return 'NO METER'

def read_uri(uri):
    h = c.query(uri)
    if len(h) == 0:
        return {}
    if len(h[0].payload_objects) == 0:
        return {}
    status = msgpack.unpackb(h[0].payload_objects[0].content)
    if status is None:
        return {}
    return status

#def read_uri_sub(uri):
#    h = c.subscribe(uri, cb)
#    if len(h) == 0:
#        return {}
#    if len(h[0].payload_objects) == 0:
#        return {}
#    status = msgpack.unpackb(h[0].payload_objects[0].content)
#    if status is None:
#        return {}
#    return status

@app.route('/api/hvac')
@crossdomain(origin="*")
def hvacstate():
    resp = config.HOD.do_query("""
SELECT * FROM %s WHERE {
  ?rtu rdf:type brick:RTU .
  ?rtu bf:feeds ?zone .
  ?zone rdf:type brick:HVAC_Zone .
  ?rtu bf:isControlledBy ?tstat .
  ?zone bf:hasPart ?room .
  ?room bf:hasPoint ?sensor .
  ?sensor rdf:type/rdfs:subClassOf* brick:Temperature_Sensor .
  ?tstat bf:uri ?tstat_uri .
  ?sensor bf:uri ?sensor_uri
 };""" % config.SITE)
    print resp
    zones = defaultdict(lambda : defaultdict(dict))
    if resp['Count'] == 0:
        return 'NO RESULTS'
    for row in resp['Rows']:
        zonename = row['?zone']
        roomname = row['?room']
        tstat = read_uri(row['?tstat_uri']+'/signal/info')
        zones[zonename]['heating_setpoint'] = tstat['heating_setpoint']
        zones[zonename]['cooling_setpoint'] = tstat['cooling_setpoint']
        zones[zonename]['tstat_temperature'] = tstat['temperature']
        zones[zonename]['heating'] = tstat['state'] == 1
        zones[zonename]['cooling'] = tstat['state'] == 2
        zones[zonename]['timestamp'] = int(tstat['time']/1e9)
        zones[zonename]['rooms'][roomname] = {'sensors': []}

    for row in resp['Rows']:
        zonename = row['?zone']
        roomname = row['?room']
        uri = row['?sensor_uri']
        data = read_uri(uri)
        if len(data) > 0:
            s = {
                'uri': uri,
                'temperature': data['temperature'],
                'relative_humidity': data['relative_humidity']
            }
            zones[zonename]['rooms'][roomname]['sensors'].append(s)

    return jsonify(zones)

@app.route('/api/hvac/day/in/<bucketsize>')
@crossdomain(origin="*")

def hvac_summary(bucketsize):
    # first, determine the start date from the 'last' argument
    today = get_today()
    q = """SELECT * FROM %s WHERE {
          ?rtu rdf:type brick:RTU .
          ?rtu bf:feeds ?zone .
          ?zone rdf:type brick:HVAC_Zone .
          ?rtu bf:isControlledBy ?tstat .
          ?tstat bf:hasPoint ?sensor .
          ?sensor rdf:type/rdfs:subClassOf* brick:Temperature_Sensor .
          ?sensor bf:uuid ?sensor_uuid .
    };
    """
    res = hodclient.do_query(q % SITE)
    zones = {}
    for row in res['Rows']:
        zones[row['?sensor_uuid']] = row['?zone']
    print zones
    query = {
        "Composition": ["tstat_temp"],
        "Selectors": [mdal.MEAN],
        "Variables": [
            {"Name": "tstat_temp",
             "Definition": q % SITE,
             "Units": "F"}
        ],
        "Time": {
            "T0": today.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "T1": datetime.now(OURTZ).strftime("%Y-%m-%d %H:%M:%S %Z"),#(monday + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S"),
            "WindowSize": bucketsize,
            "Aligned": True
        },
    }
    print query
    resp = mdalclient.do_query(query, timeout=60)
    if 'error' in resp:
        print 'ERROR', resp
        abort(500)
        abort(Response(status=resp['error']))
        return
    else:
        resp['df'].columns = [zones.get(x,x) for x in resp['df'].columns]
        return resp['df'].fillna("myNullVal").to_json()
    return "ok"

def serve_historipcal_hvac(bucketsize):
    return jsonify(hvactest.get_hvac_streams_per_zone(bucketsize))


@app.route('/api/prediction/hvac/day/in/<bucketsize>')
@crossdomain(origin="*")
def serve_prediction_hvac(bucketsize):
    return jsonify(hvactest.get_hvac_streams_per_zone(bucketsize))

@app.route('/api/prediction/dr/<provider>')
@crossdomain(origin="*")
def serve_prediction_dr(provider):
    return jsonify(drprediction.get_prediction(provider))

@app.route('/api/occupancy/<last>/in/<bucketsize>')
@crossdomain(origin="*")
def serve_occupancy(last, bucketsize):
    return jsonify(occupancy.get_occupancy(last, bucketsize))
#
@app.route('/api/hvac/day/setpoints')
@crossdomain(origin="*")
def setpoint_today():
    # first, determine the start date from the 'last' argument
    today = get_today()
    heat_q = """SELECT * FROM %s WHERE {
          ?rtu rdf:type brick:RTU .
          ?rtu bf:feeds ?zone .
          ?zone rdf:type brick:HVAC_Zone .
          ?rtu bf:isControlledBy ?tstat .
          ?tstat bf:hasPoint ?hsp .
          ?hsp rdf:type/rdfs:subClassOf* brick:Supply_Air_Temperature_Heating_Setpoint .
          ?hsp bf:uuid ?hsp_uuid
    };
    """
    cool_q = """SELECT * FROM %s WHERE {
          ?rtu rdf:type brick:RTU .
          ?rtu bf:feeds ?zone .
          ?zone rdf:type brick:HVAC_Zone .
          ?rtu bf:isControlledBy ?tstat .
          ?tstat bf:hasPoint ?csp .
          ?csp rdf:type/rdfs:subClassOf* brick:Supply_Air_Temperature_Cooling_Setpoint .
          ?csp bf:uuid ?csp_uuid
    };
    """
    res = config.HOD.do_query(heat_q % config.SITE)
    zones = {}
    for row in res['Rows']:
        zones[row['?hsp_uuid']] = row['?zone']
    res = config.HOD.do_query(cool_q % config.SITE)
    for row in res['Rows']:
        zones[row['?csp_uuid']] = row['?zone']

    query = {
        "Composition": ["heating"],
        "Selectors": [mdal.RAW],
        "Variables": [
            {"Name": "heating",
             "Definition": heat_q % config.SITE,
             "Units": "F"},
            {"Name": "cooling",
             "Definition": cool_q % config.SITE,
             "Units": "F"}
        ],
        "Time": {
            "T0": today.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "T1": datetime.now(config.TZ).strftime("%Y-%m-%d %H:%M:%S %Z"),#(monday + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S"),
        },
    }
    print query
    resp = config.MDAL.do_query(query, timeout=60)
    if 'error' in resp:
        print 'ERROR', resp
        abort(500)
        abort(Response(status=resp['error']))
        return
    for k in resp.keys():
        v = resp.pop(k)
        zone = zones.get(k,k)
        v = v[v.fillna("myNullVal").diff() != 0]
        resp[zone] = json.loads(v.to_json()) # this is the way to solve weird serialization issues

    query["Composition"] = ["cooling"]
    cool_resp = config.MDAL.do_query(query, timeout=60)
    if 'error' in cool_resp:
        print 'ERROR', cool_resp
        abort(500)
        abort(Response(status=cool_resp['error']))
        return
    for k in cool_resp.keys():
        v = cool_resp.pop(k)
        zone = zones.get(k,k)
        v = v[v.fillna("myNullVal").diff() != 0]
        v = json.loads(v.to_json())
        for ts, hsp in resp[zone].items():
            csp = v.get(ts)
            if not csp:
                continue
            resp[zone][ts] =[hsp, csp]
    return jsonify(resp)


import json
from flask_pymongo import PyMongo
app.config['MONGO_DBNAME'] = 'modes'
app.config["MONGO_URI"] = "mongodb://localhost:27017/modes"
mongo = PyMongo(app)

# Building name where this code is locally hosted
BUILDING = 'avenal-veterans-hall'

def get_building_zone_names(building_name=None):
    """ Get dict of building and its zone names.

    There are two ways of getting it,
    1. Get it directly from xbos-services-getter
    2. In case the first option doesn't work, read in json file

    Returns
    -------
    dict
        key = building name, value = list of zone names

    """

    # # Option 1
    # import xbos_services_getter
    # building_zone_names_stub = xbos_services_getter.get_building_zone_names_stub()
    # building_zone_names = xbos_services_getter.get_all_buildings_zones(building_zone_names_stub)
    # if building_name:
    #     return get_building_zone_names[building_name]
    # else:
    #     return building_zone_names

    # Option 2
    with open('building_zone_names.json') as f:
        data = json.load(f)
    if building_name:
        return data[building_name]
    else:
        return data


@app.route('/')
@crossdomain(origin="*")
def index():
    return 'Hello!'

@app.route('/save_mode')
@crossdomain(origin="*")
def save_mode():
    """ This function saves the settings & times for a particular group in "Schedule" tab. """

    zone_names = get_building_zone_names(building_name=BUILDING)

    example_input = {
        'group_name': 'East_Zone',
        'mode': 'closed',
        'zones': zone_names,
        'settings': {
            'dr': [None, None, None],
            'hol': [None, None, None],
            'sun': [None, 0, None],
            'mon': [None, None, None],
            'tue': [None, None, None],
            'wed': [None, None, None],
            'thu': [None, None, None],
            'fri': [0, None, None],
            'sat': [None, None, None]
        },
        'times': {
            'dr': ["8.00", "18.00"],
            'hol': ["8.00", "18.00"],
            'sun': ["8.00", "18.00"],
            'mon': ["8.00", "18.00"],
            'tue': ["8.00", "18.00"],
            'wed': ["8.00", "18.00"],
            'thu': ["8.00", "18.00"],
            'fri': ["10.00", "18.00"],
            'sat': ["8.00", "18.00"]
        }
    }

    print('example_input: ', example_input['zones'])

    # json.dumps converts dict -> str. Convert it to json when inserting in mongodb.
    string_example_input = json.dumps(example_input)
    json_example_input = json.loads(string_example_input)

    modes_collection = mongo.db.modes

    # result is of type bson (binary json)
    result = modes_collection.insert(json_example_input)

    if not result:
        return 'False'
    else:
        return 'True'

@app.route('/get_mode')
@crossdomain(origin="*")
def get_mode():
    """ This function retrieves the settings & times for a particular group in "Schedule" tab. """

    # result is a cursor object
    # requests.args.get() is the best way to get data from url
    result = mongo.db.modes.find({
        '$and': [
            {'group_name': request.args.get('group_name')},
            {'mode': request.args.get('mode')}
        ]
    })

    # for i, doc in enumerate(result):
    #     print 'i: ', i
    #     print doc

    from bson.json_util import dumps
    return dumps(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0',threaded=True, debug=True)
