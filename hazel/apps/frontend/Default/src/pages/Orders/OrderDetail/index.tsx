import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Button,
  Spinner,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Label,
  Input,
  FormFeedback,
  Table,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import classNames from 'classnames';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { ordersAPI, Order, OrderStatus, OrderChannel, ReturnOrderDto, InventoryImpact } from '../../../api/orders';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router-dom';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('1');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [inventoryImpact, setInventoryImpact] = useState<InventoryImpact | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  useEffect(() => {
    if (id) {
      document.title = `Order ${id} | Hazel Inventory`;
      loadOrder();
    }
  }, [id]);

  useEffect(() => {
    if (order) {
      loadWarehouses();
    }
  }, [order]);

  const loadWarehouses = async () => {
    try {
      const { warehousesAPI } = await import('../../../api/warehouses');
      const data = await warehousesAPI.listWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    }
  };

  const loadOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await ordersAPI.getOrderById(id);
      setOrder(data);
      // Load inventory impact when order is loaded
      if (data) {
        loadInventoryImpact();
      }
    } catch (err) {
      console.error('Failed to load order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryImpact = async () => {
    if (!id) return;
    try {
      setLoadingImpact(true);
      const impact = await ordersAPI.getInventoryImpact(id);
      setInventoryImpact(impact);
    } catch (err) {
      console.error('Failed to load inventory impact:', err);
      // Don't show error toast - this is optional data
    } finally {
      setLoadingImpact(false);
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    setActionLoading('confirm');
    try {
      await ordersAPI.confirmOrder(id);
      toast.success('Order confirmed successfully');
      loadOrder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this order?')) return;
    setActionLoading('cancel');
    try {
      await ordersAPI.cancelOrder(id);
      toast.success('Order cancelled successfully');
      loadOrder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleShip = async () => {
    if (!id) return;
    setActionLoading('ship');
    try {
      await ordersAPI.shipOrder(id);
      toast.success('Order shipped successfully');
      loadOrder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to ship order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFulfill = async () => {
    if (!id || !window.confirm('Mark this order as fulfilled? This will complete the order lifecycle.')) return;
    setActionLoading('fulfill');
    try {
      await ordersAPI.fulfillOrder(id);
      toast.success('Order fulfilled successfully');
      loadOrder();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fulfill order');
    } finally {
      setActionLoading(null);
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
      case OrderStatus.FULFILLED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'danger';
      case OrderStatus.RETURNED:
        return 'dark';
      default:
        return 'secondary';
    }
  };

  const getChannelLabel = (channel: OrderChannel) => {
    switch (channel) {
      case OrderChannel.DTC:
        return 'Direct-to-Consumer';
      case OrderChannel.B2B:
        return 'Business-to-Business';
      case OrderChannel.WHOLESALE:
        return 'Wholesale';
      case OrderChannel.RETAIL:
        return 'Retail';
      case OrderChannel.POS:
        return 'Point of Sale';
      default:
        return channel;
    }
  };

  // Status transition rules - guarded actions
  const canConfirm = order?.status === OrderStatus.DRAFT;
  const canCancel = order?.status && ![OrderStatus.CANCELLED, OrderStatus.FULFILLED, OrderStatus.RETURNED].includes(order.status);
  const canShip = order?.status === OrderStatus.CONFIRMED || order?.status === OrderStatus.ALLOCATED;
  const canFulfill = order?.status && [
    OrderStatus.CONFIRMED,
    OrderStatus.ALLOCATED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
  ].includes(order.status);
  const canReturn = order?.status && [
    OrderStatus.FULFILLED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
  ].includes(order.status);

  const returnValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      items: (order?.orderItems || []).map((item) => ({
        orderItemId: item.id,
        quantity: 0,
        warehouseId: '',
        reason: '',
      })),
    },
    validationSchema: Yup.object({
      items: Yup.array().of(
        Yup.object({
          orderItemId: Yup.string().required(),
          quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
          warehouseId: Yup.string().required('Warehouse is required'),
          reason: Yup.string().required('Reason is required'),
        })
      ),
    }),
    onSubmit: async (values) => {
      if (!id) return;
      const returnItems = values.items.filter((item) => item.quantity > 0);
      if (returnItems.length === 0) {
        toast.error('Please select at least one item to return');
        return;
      }

      setActionLoading('return');
      try {
        const returnData: ReturnOrderDto = {
          items: returnItems.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            warehouseId: item.warehouseId,
            reason: item.reason,
          })),
        };
        await ordersAPI.returnOrder(id, returnData);
        toast.success('Order return processed successfully');
        setIsReturnModalOpen(false);
        loadOrder();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to process return');
      } finally {
        setActionLoading(null);
      }
    },
  });

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <Spinner color="primary" />
            <p className="mt-2">Loading order...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <div className="text-danger mb-2">
              <FeatherIcon icon="alert-circle" size={48} />
            </div>
            <p className="text-danger">{error || 'Order not found'}</p>
            <Button color="primary" onClick={() => navigate('/orders')}>
              Back to Orders
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const activeReservations = order.inventoryReservations?.filter((r) => !r.consumedAt && !r.releasedAt) || [];
  const consumedReservations = order.inventoryReservations?.filter((r) => r.consumedAt) || [];
  const releasedReservations = order.inventoryReservations?.filter((r) => r.releasedAt) || [];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title={`Order ${order.orderNumber}`} pageTitle="Orders" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="card-title mb-0">Order {order.orderNumber}</h5>
                    <Badge color={getStatusBadgeColor(order.status)} className="mt-2">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="d-flex gap-2">
                    {canConfirm && (
                      <Button
                        color="primary"
                        onClick={handleConfirm}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === 'confirm' ? <Spinner size="sm" className="me-1" /> : null}
                        Confirm Order
                      </Button>
                    )}
                    {canShip && (
                      <Button
                        color="warning"
                        onClick={handleShip}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === 'ship' ? <Spinner size="sm" className="me-1" /> : null}
                        Ship Order
                      </Button>
                    )}
                    {canFulfill && (
                      <Button
                        color="success"
                        onClick={handleFulfill}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === 'fulfill' ? <Spinner size="sm" className="me-1" /> : null}
                        Fulfill Order
                      </Button>
                    )}
                    {canReturn && (
                      <Button
                        color="info"
                        onClick={() => setIsReturnModalOpen(true)}
                        disabled={actionLoading !== null}
                      >
                        Return Items
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        color="danger"
                        onClick={handleCancel}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === 'cancel' ? <Spinner size="sm" className="me-1" /> : null}
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardBody>
                  <Nav tabs className="nav-tabs-custom">
                    <NavItem>
                      <NavLink
                        className={classNames({ active: activeTab === '1' })}
                        onClick={() => setActiveTab('1')}
                      >
                        Order Info
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classNames({ active: activeTab === '2' })}
                        onClick={() => setActiveTab('2')}
                      >
                        Items
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classNames({ active: activeTab === '3' })}
                        onClick={() => setActiveTab('3')}
                      >
                        Reservations
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classNames({ active: activeTab === '4' })}
                        onClick={() => setActiveTab('4')}
                      >
                        Inventory Impact
                      </NavLink>
                    </NavItem>
                  </Nav>

                  <TabContent activeTab={activeTab} className="p-4">
                    <TabPane tabId="1">
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Order Number</Label>
                            <p><strong>{order.orderNumber}</strong></p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label">Channel</Label>
                            <p>
                              <Badge color="info">{getChannelLabel(order.channel)}</Badge>
                              <small className="text-muted ms-2">({order.channel})</small>
                            </p>
                          </div>
                          {order.customer && (
                            <div className="mb-3">
                              <Label className="form-label">Customer</Label>
                              <p>
                                <Link to={`/customers/${order.customer.id}`}>
                                  <strong>{order.customer.companyName}</strong>
                                </Link>
                                <Badge color="secondary" className="ms-2">{order.customer.type}</Badge>
                                {order.customer.status !== 'ACTIVE' && (
                                  <Badge color="warning" className="ms-1">{order.customer.status}</Badge>
                                )}
                              </p>
                            </div>
                          )}
                          <div className="mb-3">
                            <Label className="form-label">Status</Label>
                            <p><Badge color={getStatusBadgeColor(order.status)}>{order.status}</Badge></p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label">Status Timeline</Label>
                            <div className="mt-2">
                              <div className="d-flex align-items-center mb-2">
                                <div className={classNames('rounded-circle', {
                                  'bg-success': true,
                                  'bg-secondary': order.status === OrderStatus.DRAFT,
                                })} style={{ width: '12px', height: '12px', marginRight: '10px' }} />
                                <span className={classNames({ 'text-muted': order.status === OrderStatus.DRAFT })}>
                                  Draft {order.createdAt && <small className="text-muted">({new Date(order.createdAt).toLocaleString()})</small>}
                                </span>
                              </div>
                              <div className="d-flex align-items-center mb-2">
                                <div className={classNames('rounded-circle', {
                                  'bg-info': [OrderStatus.CONFIRMED, OrderStatus.ALLOCATED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.FULFILLED, OrderStatus.RETURNED].includes(order.status),
                                  'bg-secondary': order.status === OrderStatus.DRAFT || order.status === OrderStatus.CANCELLED,
                                })} style={{ width: '12px', height: '12px', marginRight: '10px' }} />
                                <span className={classNames({ 'text-muted': order.status === OrderStatus.DRAFT || order.status === OrderStatus.CANCELLED })}>
                                  Confirmed {order.confirmedAt && <small className="text-muted">({new Date(order.confirmedAt).toLocaleString()})</small>}
                                </span>
                              </div>
                              {(order.status === OrderStatus.ALLOCATED || order.shippedAt) && (
                                <div className="d-flex align-items-center mb-2">
                                  <div className="rounded-circle bg-primary" style={{ width: '12px', height: '12px', marginRight: '10px' }} />
                                  <span>
                                    {order.status === OrderStatus.ALLOCATED ? 'Allocated' : 'Shipped'} {order.shippedAt && <small className="text-muted">({new Date(order.shippedAt).toLocaleString()})</small>}
                                  </span>
                                </div>
                              )}
                              {(order.status === OrderStatus.FULFILLED || order.fulfilledAt) && (
                                <div className="d-flex align-items-center mb-2">
                                  <div className="rounded-circle bg-success" style={{ width: '12px', height: '12px', marginRight: '10px' }} />
                                  <span>
                                    Fulfilled {order.fulfilledAt && <small className="text-muted">({new Date(order.fulfilledAt).toLocaleString()})</small>}
                                  </span>
                                </div>
                              )}
                              {order.status === OrderStatus.CANCELLED && (
                                <div className="d-flex align-items-center mb-2">
                                  <div className="rounded-circle bg-danger" style={{ width: '12px', height: '12px', marginRight: '10px' }} />
                                  <span className="text-danger">
                                    Cancelled {order.cancelledAt && <small className="text-muted">({new Date(order.cancelledAt).toLocaleString()})</small>}
                                  </span>
                                </div>
                              )}
                              {order.status === OrderStatus.RETURNED && (
                                <div className="d-flex align-items-center mb-2">
                                  <div className="rounded-circle bg-dark" style={{ width: '12px', height: '12px', marginRight: '10px' }} />
                                  <span className="text-dark">
                                    Returned
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label className="form-label">Total Amount</Label>
                            <p><strong>{order.totalAmount.toFixed(2)} {order.currency}</strong></p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label">Created At</Label>
                            <p>{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          {order.confirmedAt && (
                            <div className="mb-3">
                              <Label className="form-label">Confirmed At</Label>
                              <p>{new Date(order.confirmedAt).toLocaleString()}</p>
                            </div>
                          )}
                          {order.allocatedAt && (
                            <div className="mb-3">
                              <Label className="form-label">Allocated At</Label>
                              <p>{new Date(order.allocatedAt).toLocaleString()}</p>
                            </div>
                          )}
                          {order.shippedAt && (
                            <div className="mb-3">
                              <Label className="form-label">Shipped At</Label>
                              <p>{new Date(order.shippedAt).toLocaleString()}</p>
                            </div>
                          )}
                          {order.fulfilledAt && (
                            <div className="mb-3">
                              <Label className="form-label">Fulfilled At</Label>
                              <p>{new Date(order.fulfilledAt).toLocaleString()}</p>
                            </div>
                          )}
                          {order.cancelledAt && (
                            <div className="mb-3">
                              <Label className="form-label">Cancelled At</Label>
                              <p>{new Date(order.cancelledAt).toLocaleString()}</p>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </TabPane>

                    <TabPane tabId="2">
                      <div className="table-responsive">
                        <Table className="table-nowrap align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Product</th>
                              <th>Variant SKU</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.orderItems?.map((item) => (
                              <tr key={item.id}>
                                <td>{item.productVariant?.product.name || 'N/A'}</td>
                                <td>{item.productVariant?.sku || 'N/A'}</td>
                                <td>{item.quantity}</td>
                                <td>{item.unitPrice.toFixed(2)}</td>
                                <td><strong>{item.totalPrice.toFixed(2)}</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </TabPane>

                    <TabPane tabId="3">
                      <div className="mb-3">
                        <h6>Active Reservations ({activeReservations.length})</h6>
                        {activeReservations.length > 0 ? (
                          <Table className="table-sm">
                            <thead>
                              <tr>
                                <th>Product Variant</th>
                                <th>Warehouse</th>
                                <th>Quantity</th>
                                <th>Reserved At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeReservations.map((res) => (
                                <tr key={res.id}>
                                  <td>
                                    {res.inventoryItem?.productVariant?.product?.name || 'N/A'} - <code>{res.inventoryItem?.productVariant?.sku || res.productVariantId}</code>
                                  </td>
                                  <td>{res.inventoryItem?.warehouse?.name || res.warehouseId} {res.inventoryItem?.warehouse?.location && <small className="text-muted">({res.inventoryItem.warehouse.location})</small>}</td>
                                  <td>{res.quantity}</td>
                                  <td>{new Date(res.reservedAt).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <p className="text-muted">No active reservations</p>
                        )}
                      </div>
                      {consumedReservations.length > 0 && (
                        <div className="mb-3">
                          <h6>Consumed Reservations ({consumedReservations.length})</h6>
                          <Table className="table-sm">
                            <thead>
                              <tr>
                                <th>Product Variant</th>
                                <th>Warehouse</th>
                                <th>Quantity</th>
                                <th>Consumed At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consumedReservations.map((res) => (
                                <tr key={res.id}>
                                  <td>
                                    {res.inventoryItem?.productVariant?.product?.name || 'N/A'} - <code>{res.inventoryItem?.productVariant?.sku || res.productVariantId}</code>
                                  </td>
                                  <td>{res.inventoryItem?.warehouse?.name || res.warehouseId} {res.inventoryItem?.warehouse?.location && <small className="text-muted">({res.inventoryItem.warehouse.location})</small>}</td>
                                  <td>{res.quantity}</td>
                                  <td>{res.consumedAt ? new Date(res.consumedAt).toLocaleString() : 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                      {releasedReservations.length > 0 && (
                        <div>
                          <h6>Released Reservations ({releasedReservations.length})</h6>
                          <Table className="table-sm">
                            <thead>
                              <tr>
                                <th>Product Variant</th>
                                <th>Warehouse</th>
                                <th>Quantity</th>
                                <th>Released At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {releasedReservations.map((res) => (
                                <tr key={res.id}>
                                  <td>
                                    {res.inventoryItem?.productVariant?.product?.name || 'N/A'} - <code>{res.inventoryItem?.productVariant?.sku || res.productVariantId}</code>
                                  </td>
                                  <td>{res.inventoryItem?.warehouse?.name || res.warehouseId} {res.inventoryItem?.warehouse?.location && <small className="text-muted">({res.inventoryItem.warehouse.location})</small>}</td>
                                  <td>{res.quantity}</td>
                                  <td>{res.releasedAt ? new Date(res.releasedAt).toLocaleString() : 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </TabPane>

                    <TabPane tabId="4">
                      {loadingImpact ? (
                        <div className="text-center py-4">
                          <Spinner color="primary" />
                          <p className="mt-2">Loading inventory impact...</p>
                        </div>
                      ) : inventoryImpact ? (
                        <div>
                          <Row className="mb-4">
                            <Col md={4}>
                              <Card className="border border-info">
                                <CardBody>
                                  <h6 className="text-muted mb-2">Active Reservations</h6>
                                  <h3 className="mb-0 text-info">{inventoryImpact.reservations.active}</h3>
                                  <small className="text-muted">Currently reserved</small>
                                </CardBody>
                              </Card>
                            </Col>
                            <Col md={4}>
                              <Card className="border border-success">
                                <CardBody>
                                  <h6 className="text-muted mb-2">Consumed</h6>
                                  <h3 className="mb-0 text-success">{inventoryImpact.reservations.consumed}</h3>
                                  <small className="text-muted">Inventory deducted</small>
                                </CardBody>
                              </Card>
                            </Col>
                            <Col md={4}>
                              <Card className="border border-warning">
                                <CardBody>
                                  <h6 className="text-muted mb-2">Released</h6>
                                  <h3 className="mb-0 text-warning">{inventoryImpact.reservations.released}</h3>
                                  <small className="text-muted">Returned to stock</small>
                                </CardBody>
                              </Card>
                            </Col>
                          </Row>

                          <div className="mb-3">
                            <h6>Inventory Impact by Product Variant & Warehouse</h6>
                            {inventoryImpact.inventoryImpact.length > 0 ? (
                              <div className="table-responsive">
                                <Table className="table-nowrap align-middle mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Product Variant SKU</th>
                                      <th>Warehouse</th>
                                      <th className="text-end">Reserved</th>
                                      <th className="text-end">Consumed</th>
                                      <th className="text-end">Released</th>
                                      <th className="text-end">Net Impact</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inventoryImpact.inventoryImpact.map((impact, idx) => (
                                      <tr key={idx}>
                                        <td>
                                          <code>{impact.productVariantSku}</code>
                                        </td>
                                        <td>{impact.warehouseName}</td>
                                        <td className="text-end">
                                          {impact.quantityReserved > 0 && (
                                            <Badge color="info">{impact.quantityReserved}</Badge>
                                          )}
                                          {impact.quantityReserved === 0 && <span className="text-muted">-</span>}
                                        </td>
                                        <td className="text-end">
                                          {impact.quantityConsumed > 0 && (
                                            <Badge color="success">-{impact.quantityConsumed}</Badge>
                                          )}
                                          {impact.quantityConsumed === 0 && <span className="text-muted">-</span>}
                                        </td>
                                        <td className="text-end">
                                          {impact.quantityReleased > 0 && (
                                            <Badge color="warning">+{impact.quantityReleased}</Badge>
                                          )}
                                          {impact.quantityReleased === 0 && <span className="text-muted">-</span>}
                                        </td>
                                        <td className="text-end">
                                          <strong className={impact.netImpact < 0 ? 'text-danger' : impact.netImpact > 0 ? 'text-success' : ''}>
                                            {impact.netImpact < 0 ? impact.netImpact : impact.netImpact > 0 ? `+${impact.netImpact}` : 0}
                                          </strong>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="table-light">
                                    <tr>
                                      <th colSpan={2}>Total Net Impact</th>
                                      <th className="text-end" colSpan={1}>
                                        {inventoryImpact.inventoryImpact.reduce((sum, impact) => sum + impact.quantityReserved, 0)}
                                      </th>
                                      <th className="text-end" colSpan={1}>
                                        {inventoryImpact.inventoryImpact.reduce((sum, impact) => sum + impact.quantityConsumed, 0)}
                                      </th>
                                      <th className="text-end" colSpan={1}>
                                        {inventoryImpact.inventoryImpact.reduce((sum, impact) => sum + impact.quantityReleased, 0)}
                                      </th>
                                      <th className="text-end">
                                        <strong className={
                                          inventoryImpact.inventoryImpact.reduce((sum, impact) => sum + impact.netImpact, 0) < 0
                                            ? 'text-danger'
                                            : inventoryImpact.inventoryImpact.reduce((sum, impact) => sum + impact.netImpact, 0) > 0
                                            ? 'text-success'
                                            : ''
                                        }>
                                          {inventoryImpact.inventoryImpact.reduce((sum, impact) => sum + impact.netImpact, 0)}
                                        </strong>
                                      </th>
                                    </tr>
                                  </tfoot>
                                </Table>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-muted">No inventory impact data available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">Unable to load inventory impact data</p>
                          <Button color="primary" size="sm" onClick={loadInventoryImpact}>
                            Retry
                          </Button>
                        </div>
                      )}
                    </TabPane>
                  </TabContent>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Return Modal */}
      <Modal isOpen={isReturnModalOpen} toggle={() => setIsReturnModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setIsReturnModalOpen(false)}>Return Order Items</ModalHeader>
        <ModalBody>
          <Form onSubmit={returnValidation.handleSubmit}>
            {order.orderItems?.map((orderItem, index) => (
              <Card key={orderItem.id} className="mb-3">
                <CardBody>
                  <h6>{orderItem.productVariant?.product.name || 'Product'} - {orderItem.productVariant?.sku || 'SKU'}</h6>
                  <p className="text-muted small">Ordered: {orderItem.quantity} × {orderItem.unitPrice.toFixed(2)}</p>
                  <Row>
                    <Col md={4}>
                      <Label className="form-label">Return Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        max={orderItem.quantity}
                        value={returnValidation.values.items[index]?.quantity || 0}
                        onChange={(e) => {
                          const updated = [...returnValidation.values.items];
                          updated[index] = {
                            ...updated[index],
                            quantity: parseInt(e.target.value) || 0,
                            orderItemId: orderItem.id,
                          };
                          returnValidation.setFieldValue('items', updated);
                        }}
                      />
                    </Col>
                    <Col md={4}>
                      <Label className="form-label">Warehouse</Label>
                      <Input
                        type="select"
                        value={returnValidation.values.items[index]?.warehouseId || ''}
                        onChange={(e) => {
                          const updated = [...returnValidation.values.items];
                          updated[index] = {
                            ...updated[index],
                            warehouseId: e.target.value,
                            orderItemId: orderItem.id,
                          };
                          returnValidation.setFieldValue('items', updated);
                        }}
                      >
                        <option value="">Select warehouse</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.location}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={12} className="mt-2">
                      <Label className="form-label">Reason</Label>
                      <Input
                        type="textarea"
                        rows={2}
                        value={returnValidation.values.items[index]?.reason || ''}
                        onChange={(e) => {
                          const updated = [...returnValidation.values.items];
                          updated[index] = {
                            ...updated[index],
                            reason: e.target.value,
                            orderItemId: orderItem.id,
                          };
                          returnValidation.setFieldValue('items', updated);
                        }}
                        placeholder="Enter return reason"
                      />
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            ))}
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                color="light"
                onClick={() => setIsReturnModalOpen(false)}
                disabled={actionLoading !== null}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={actionLoading !== null}
              >
                {actionLoading === 'return' ? (
                  <>
                    <Spinner size="sm" className="me-1" />
                    Processing...
                  </>
                ) : (
                  'Process Return'
                )}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default OrderDetail;

