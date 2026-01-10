import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Button,
  Spinner,
  Badge,
  Input,
  Label,
} from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { ordersAPI, Order, OrderStatus, OrderChannel } from '../../../api/orders';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const OrderList: React.FC = () => {
  document.title = 'Orders | Hazel Inventory';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersAPI.listOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DRAFT:
        return 'secondary';
      case OrderStatus.CONFIRMED:
        return 'info';
      case OrderStatus.ALLOCATED:
        return 'primary';
      case OrderStatus.SHIPPED:
        return 'warning';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.COMPLETED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'danger';
      case OrderStatus.RETURNED:
        return 'dark';
      default:
        return 'secondary';
    }
  };

  const getChannelBadgeColor = (channel: OrderChannel) => {
    switch (channel) {
      case OrderChannel.DTC:
        return 'primary';
      case OrderChannel.B2B:
        return 'info';
      case OrderChannel.POS:
        return 'success';
      case OrderChannel.WHOLESALE:
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (channelFilter && order.channel !== channelFilter) return false;
    return true;
  });

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Orders" pageTitle="Orders" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Orders</h5>
                  <Link to="/orders/create">
                    <Button color="primary" className="btn-sm">
                      <FeatherIcon icon="plus" className="me-1" size={16} />
                      Create Order
                    </Button>
                  </Link>
                </CardHeader>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={3}>
                      <Label className="form-label">Filter by Status</Label>
                      <Input
                        type="select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {Object.values(OrderStatus).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={3}>
                      <Label className="form-label">Filter by Channel</Label>
                      <Input
                        type="select"
                        value={channelFilter}
                        onChange={(e) => setChannelFilter(e.target.value)}
                      >
                        <option value="">All Channels</option>
                        {Object.values(OrderChannel).map((channel) => (
                          <option key={channel} value={channel}>
                            {channel}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Button
                        color="light"
                        onClick={() => {
                          setStatusFilter('');
                          setChannelFilter('');
                        }}
                        disabled={!statusFilter && !channelFilter}
                      >
                        Clear Filters
                      </Button>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading orders...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadOrders}>
                        Retry
                      </Button>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="shopping-cart" size={64} />
                      </div>
                      <h5>No Orders Found</h5>
                      <p className="text-muted">
                        {statusFilter || channelFilter
                          ? 'No orders match your filters.'
                          : 'No orders found. Create your first order to get started.'}
                      </p>
                      {!statusFilter && !channelFilter && (
                        <Link to="/orders/create">
                          <Button color="primary">
                            <FeatherIcon icon="plus" className="me-1" size={16} />
                            Create Order
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Order Number</th>
                            <th scope="col">Channel</th>
                            <th scope="col">Status</th>
                            <th scope="col">Total Amount</th>
                            <th scope="col">Currency</th>
                            <th scope="col">Created At</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr key={order.id}>
                              <td>
                                <strong>{order.orderNumber}</strong>
                              </td>
                              <td>
                                <Badge color={getChannelBadgeColor(order.channel)}>
                                  {order.channel}
                                </Badge>
                              </td>
                              <td>
                                <Badge color={getStatusBadgeColor(order.status)}>
                                  {order.status}
                                </Badge>
                              </td>
                              <td>
                                <strong>{order.totalAmount.toFixed(2)}</strong>
                              </td>
                              <td>{order.currency}</td>
                              <td>
                                {new Date(order.createdAt).toLocaleString()}
                              </td>
                              <td className="text-end">
                                <Link to={`/orders/${order.id}`}>
                                  <Button color="soft-primary" size="sm">
                                    <FeatherIcon icon="eye" size={14} />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default OrderList;

