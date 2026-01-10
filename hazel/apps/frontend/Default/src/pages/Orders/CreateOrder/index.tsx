import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Form,
  Label,
  Input,
  FormFeedback,
  Button,
  Table,
  Spinner,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { ordersAPI, CreateOrderDto, OrderChannel, CreateOrderItemDto } from '../../../api/orders';
import { productsAPI } from '../../../api/products';
import { warehousesAPI } from '../../../api/warehouses';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

interface OrderItemForm {
  productVariantId: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;
}

const CreateOrder: React.FC = () => {
  document.title = 'Create Order | Hazel Inventory';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [items, setItems] = useState<OrderItemForm[]>([
    { productVariantId: '', warehouseId: '', quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    loadProducts();
    loadWarehouses();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await productsAPI.getProducts();
      const productsWithVariants = await Promise.all(
        productsData.map(async (product) => {
          try {
            const variants = await productsAPI.listVariants(product.id);
            return { ...product, variants };
          } catch {
            return { ...product, variants: [] };
          }
        })
      );
      setProducts(productsWithVariants);
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error('Failed to load products');
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await warehousesAPI.listWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      toast.error('Failed to load warehouses');
    }
  };

  const allVariants = products.flatMap((product) =>
    (product.variants || []).map((variant: any) => ({
      ...variant,
      productName: product.name,
    }))
  );

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      channel: OrderChannel.DTC,
      currency: 'USD',
    },
    validationSchema: Yup.object({
      channel: Yup.string().required('Channel is required'),
      currency: Yup.string().required('Currency is required'),
    }),
    onSubmit: async (values) => {
      if (items.length === 0 || items.some((item) => !item.productVariantId || !item.warehouseId || item.quantity <= 0)) {
        toast.error('Please add at least one valid order item');
        return;
      }

      setLoading(true);
      try {
        const orderItems: CreateOrderItemDto[] = items.map((item) => ({
          productVariantId: item.productVariantId,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }));

        const data: CreateOrderDto = {
          channel: values.channel as OrderChannel,
          currency: values.currency,
          items: orderItems,
        };

        const order = await ordersAPI.createOrder(data);
        toast.success('Order created successfully');
        navigate(`/orders/${order.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create order');
      } finally {
        setLoading(false);
      }
    },
  });

  const addItem = () => {
    setItems([...items, { productVariantId: '', warehouseId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Create Order" pageTitle="Orders" />
          <Row>
            <Col lg={10}>
              <Card>
                <CardHeader>
                  <h5 className="card-title mb-0">Create New Order</h5>
                </CardHeader>
                <CardBody>
                  <Form onSubmit={validation.handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">
                            Channel <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="select"
                            name="channel"
                            value={validation.values.channel}
                            onChange={validation.handleChange}
                            invalid={validation.touched.channel && !!validation.errors.channel}
                          >
                            {Object.values(OrderChannel).map((channel) => (
                              <option key={channel} value={channel}>
                                {channel}
                              </option>
                            ))}
                          </Input>
                          {validation.touched.channel && validation.errors.channel && (
                            <FormFeedback type="invalid">{validation.errors.channel}</FormFeedback>
                          )}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label className="form-label">
                            Currency <span className="text-danger">*</span>
                          </Label>
                          <Input
                            type="text"
                            name="currency"
                            value={validation.values.currency}
                            onChange={validation.handleChange}
                            invalid={validation.touched.currency && !!validation.errors.currency}
                            placeholder="USD"
                          />
                          {validation.touched.currency && validation.errors.currency && (
                            <FormFeedback type="invalid">{validation.errors.currency}</FormFeedback>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Label className="form-label mb-0">Order Items</Label>
                        <Button type="button" color="success" size="sm" onClick={addItem}>
                          <FeatherIcon icon="plus" size={14} className="me-1" />
                          Add Item
                        </Button>
                      </div>

                      <div className="table-responsive">
                        <Table className="table-nowrap align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Product Variant</th>
                              <th>Warehouse</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Total</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <Input
                                    type="select"
                                    value={item.productVariantId}
                                    onChange={(e) => updateItem(index, 'productVariantId', e.target.value)}
                                    required
                                  >
                                    <option value="">Select variant</option>
                                    {allVariants.map((variant) => (
                                      <option key={variant.id} value={variant.id}>
                                        {variant.productName} - {variant.sku}
                                      </option>
                                    ))}
                                  </Input>
                                </td>
                                <td>
                                  <Input
                                    type="select"
                                    value={item.warehouseId}
                                    onChange={(e) => updateItem(index, 'warehouseId', e.target.value)}
                                    required
                                  >
                                    <option value="">Select warehouse</option>
                                    {warehouses.map((warehouse) => (
                                      <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                      </option>
                                    ))}
                                  </Input>
                                </td>
                                <td>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                    required
                                  />
                                </td>
                                <td>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    required
                                  />
                                </td>
                                <td>
                                  <strong>{(item.quantity * item.unitPrice).toFixed(2)}</strong>
                                </td>
                                <td>
                                  <Button
                                    type="button"
                                    color="danger"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length === 1}
                                  >
                                    <FeatherIcon icon="trash-2" size={14} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>

                      <div className="mt-3 text-end">
                        <strong>Total Amount: {totalAmount.toFixed(2)} {validation.values.currency}</strong>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <Button
                        type="button"
                        color="light"
                        onClick={() => navigate('/orders')}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        color="primary"
                        disabled={loading || items.length === 0 || totalAmount <= 0}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="me-1" />
                            Creating...
                          </>
                        ) : (
                          'Create Order'
                        )}
                      </Button>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CreateOrder;

