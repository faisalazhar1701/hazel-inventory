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
import { ordersAPI, Order, OrderStatus, ReturnOrderDto } from '../../../api/orders';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

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
    } catch (err) {
      console.error('Failed to load order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
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

  const canConfirm = order?.status === OrderStatus.DRAFT;
  const canCancel = order?.status && ![OrderStatus.CANCELLED, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status);
  const canShip = order?.status === OrderStatus.CONFIRMED || order?.status === OrderStatus.ALLOCATED;
  const canReturn = order?.status && [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status);

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
                            <p><Badge color="info">{order.channel}</Badge></p>
                          </div>
                          <div className="mb-3">
                            <Label className="form-label">Status</Label>
                            <p><Badge color={getStatusBadgeColor(order.status)}>{order.status}</Badge></p>
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
                          {order.shippedAt && (
                            <div className="mb-3">
                              <Label className="form-label">Shipped At</Label>
                              <p>{new Date(order.shippedAt).toLocaleString()}</p>
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
                                  <td>{res.productVariantId}</td>
                                  <td>{res.warehouseId}</td>
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
                                  <td>{res.productVariantId}</td>
                                  <td>{res.warehouseId}</td>
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
                                  <td>{res.productVariantId}</td>
                                  <td>{res.warehouseId}</td>
                                  <td>{res.quantity}</td>
                                  <td>{res.releasedAt ? new Date(res.releasedAt).toLocaleString() : 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
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

