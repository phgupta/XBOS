from collections import defaultdict
import pandas as pd
from xbos import get_client
from xbos.services import hod, mdal
from datetime import datetime, date, timedelta
import json
import config
import pytz

heating_setpoint_query = """SELECT * FROM %s WHERE {
          ?rtu rdf:type brick:RTU .
          ?rtu bf:feeds ?zone .
          ?zone rdf:type brick:HVAC_Zone .
          ?rtu bf:isControlledBy ?tstat .
          ?tstat bf:hasPoint ?hsp .
          ?hsp rdf:type/rdfs:subClassOf* brick:Supply_Air_Temperature_Heating_Setpoint .
          ?hsp bf:uuid ?hsp_uuid
    };""" % config.SITE

cooling_setpoint_query = """SELECT * FROM %s WHERE {
          ?rtu rdf:type brick:RTU .
          ?rtu bf:feeds ?zone .
          ?zone rdf:type brick:HVAC_Zone .
          ?rtu bf:isControlledBy ?tstat .
          ?tstat bf:hasPoint ?csp .
          ?csp rdf:type/rdfs:subClassOf* brick:Supply_Air_Temperature_Cooling_Setpoint .
          ?csp bf:uuid ?csp_uuid
    };""" % config.SITE

thermostat_temperature = """SELECT * FROM %s WHERE {
          ?rtu rdf:type brick:RTU .
          ?rtu bf:feeds ?zone .
          ?zone rdf:type brick:HVAC_Zone .
          ?rtu bf:isControlledBy ?tstat .
          ?tstat bf:hasPoint ?sensor .
          ?sensor rdf:type/rdfs:subClassOf* brick:Temperature_Sensor .
          ?sensor bf:uuid ?sensor_uuid .
    };""" % config.SITE

thermostat_state = """SELECT * FROM %s WHERE {
          ?rtu rdf:type brick:RTU .
          ?rtu bf:feeds ?zone .
          ?zone rdf:type brick:HVAC_Zone .
          ?rtu bf:isControlledBy ?tstat .
          ?tstat bf:hasPoint ?state .
          ?state rdf:type/rdfs:subClassOf* brick:Thermostat_Status .
          ?state bf:uuid ?state_uuid .
    };""" % config.SITE

outside_temperature = """SELECT * FROM %s WHERE {
          ?sensor rdf:type/rdfs:subClassOf* brick:Weather_Temperature_Sensor .
          ?sensor bf:uuid ?sensor_uuid .
    };""" % config.SITE

def get_today():
    d = datetime.now(config.TZ)
    return config.TZ.localize(datetime(year=d.year, month=d.month, day=d.day))

full_query = {
    "Composition": ['inside','state','outside','heating','cooling'],
    "Selectors": [mdal.MEAN, mdal.MAX, mdal.MEAN, mdal.MAX, mdal.MAX],
    "Variables": [
        {
         "Name": "inside",
         "Definition": thermostat_temperature,
        },
        {
         "Name": "state",
         "Definition": thermostat_state,
        },
        {
         "Name": "outside",
         "Definition": outside_temperature,
        },
        {
         "Name": "heating",
         "Definition": heating_setpoint_query,
        },
        {
         "Name": "cooling",
         "Definition": cooling_setpoint_query,
        },
    ],
}

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

def get_hvac_streams_per_zone(bucketsize="1m"):
    zones = defaultdict(lambda : defaultdict(list))
    inside_res = config.HOD.do_query(thermostat_temperature)
    for row in inside_res['Rows']:
        zones[row['?zone']]['inside'].append(row['?sensor_uuid'])

    state_res = config.HOD.do_query(thermostat_state)
    for row in state_res['Rows']:
        zones[row['?zone']]['state'].append(row['?state_uuid'])

    outside_res = config.HOD.do_query(outside_temperature)
    for row in outside_res['Rows']:
        for zonename in zones.keys():
            zones[zonename]['outside'].append(row['?sensor_uuid'])

    hsp_res = config.HOD.do_query(heating_setpoint_query)
    for row in hsp_res['Rows']:
        zones[row['?zone']]['heating'].append(row['?hsp_uuid'])

    csp_res = config.HOD.do_query(cooling_setpoint_query)
    for row in csp_res['Rows']:
        zones[row['?zone']]['cooling'].append(row['?csp_uuid'])

    print zones
    full_query['Time'] = {
        "T0": get_today().strftime("%Y-%m-%d %H:%M:%S %Z"),
        "T1": datetime.now(config.TZ).strftime("%Y-%m-%d %H:%M:%S %Z"),
        "Aligned": True,
        "WindowSize": bucketsize,
    }
    print full_query
    resp = config.MDAL.do_query(full_query, timeout=120)
    if 'error' in resp:
        print 'ERROR', resp
        return
    df = resp['df'].fillna(method='ffill').fillna(method='bfill')
    results = zones.copy()
    #import IPython; IPython.embed()
    for zonename, zonedict in results.items():
        zonedict['inside'] = json.loads(df[zonedict['inside']].mean(axis=1).to_json())
        zonedict['outside'] = json.loads(df[zonedict['outside']].mean(axis=1).to_json())
        zonedict['heating'] = json.loads(df[zonedict['heating']].max(axis=1).to_json())
        zonedict['cooling'] = json.loads(df[zonedict['cooling']].max(axis=1).to_json())
        zonedict['state'] = json.loads(df[zonedict['state']].max(axis=1).apply(state_to_string).to_json())
        results[zonename] = zonedict
    json.dump(results, open('results.json','w'))
    return results

if __name__ == '__main__':
    get_hvac_streams_per_zone()
