"""

Questions,

1. In energyChart.js --> load --> data is received but not outputted on the web page,
    "energyChart.series[0].data[energyChart.series[0].data.length - 1].doDrilldown();"
        1. In app.py --> power_summary() & energy_summary() data returned from pymortar is all NaN's.
    Use avenal-movie-theatre for now.

2. DR MPC Simulation.
    Files: app.py --> simulate_lambda(). xsg.py --> simulation(). DR.js --> $("#bldng-btn").click(function() {}
    xsg.get_mpc_simulation() gives error: 'end date is in the future'. Once this is fixed, the MPC simulation should work.

"""


"""
import pytz
import datetime
import xbos_services_getter

start = pytz.timezone('UTC').localize(datetime.datetime(2019, 7, 10, 0, 0, 0))
end = pytz.timezone('UTC').localize(datetime.datetime(2019, 7, 17, 17, 0, 0))

meter_data_historical_stub = xbos_services_getter.get_meter_data_historical_stub()
df = xbos_services_getter.get_meter_data_historical(meter_data_historical_stub,
                                                    bldg='ciee',
                                                    start=start, end=end,
                                                    point_type='Building_Electric_Meter',
                                                    aggregate='MEAN',
                                                    window='15m')
print(df)
"""

"""
import xsg

site = 'ciee'
start = '2019-07-18 06:18:49+00:00'
end = '2019-07-18 07:18:49+00:00'
drlambda = 0.58
zone = 'hvac_zone_centralzone'

res = xsg.simulation(site, start, end, '1h', float(drlambda), zone=zone)
print(res)
"""

"""

General Notes,

# requests.args.get() is the best way to get data from url
result = mongo.db.modes.find({
    '$and': [
        {'group_name': request.args.get('group_name')},
        {'mode': request.args.get('mode')}
    ]
})

For POST request where dataType=json use,
request.data

"""