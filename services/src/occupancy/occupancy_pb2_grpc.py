# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
import grpc

import occupancy_pb2 as occupancy__pb2


class OccupancyStub(object):
  """The temperature service definition.
  """

  def __init__(self, channel):
    """Constructor.

    Args:
      channel: A grpc.Channel.
    """
    self.GetOccupancy = channel.unary_unary(
        '/occupancy_historical.Occupancy/GetOccupancy',
        request_serializer=occupancy__pb2.Request.SerializeToString,
        response_deserializer=occupancy__pb2.OccupancyReply.FromString,
        )


class OccupancyServicer(object):
  """The temperature service definition.
  """

  def GetOccupancy(self, request, context):
    """A simple RPC.

    Sends the historic occupancy for a given building and zone within a duration (start, end), and a requested window
    An error  is returned if there are no temperature for the given request
    """
    context.set_code(grpc.StatusCode.UNIMPLEMENTED)
    context.set_details('Method not implemented!')
    raise NotImplementedError('Method not implemented!')


def add_OccupancyServicer_to_server(servicer, server):
  rpc_method_handlers = {
      'GetOccupancy': grpc.unary_unary_rpc_method_handler(
          servicer.GetOccupancy,
          request_deserializer=occupancy__pb2.Request.FromString,
          response_serializer=occupancy__pb2.OccupancyReply.SerializeToString,
      ),
  }
  generic_handler = grpc.method_handlers_generic_handler(
      'occupancy_historical.Occupancy', rpc_method_handlers)
  server.add_generic_rpc_handlers((generic_handler,))
