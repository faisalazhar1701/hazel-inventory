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
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  Label,
  FormFeedback,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { inventoryAPI, InventoryItem, AddInventoryDto, DeductInventoryDto, InventoryItemType } from '../../../api/inventory';
import { warehousesAPI } from '../../../api/warehouses';
import { productsAPI } from '../../../api/products';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const InventoryOverview: React.FC = () => {
  document.title = 'Inventory Overview | Hazel Inventory';

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterWarehouse, setFilterWarehouse] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await loadWarehouses();
      await loadProducts();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!loadingWarehouses && warehouses.length > 0) {
      if (filterWarehouse) {
        loadInventoryByWarehouse(filterWarehouse);
      } else {
        loadAllInventory();
      }
    }
  }, [filterWarehouse, loadingWarehouses]);

  const loadWarehouses = async () => {
    try {
      setLoadingWarehouses(true);
      const data = await warehousesAPI.listWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      toast.error('Failed to load warehouses');
    } finally {
      setLoadingWarehouses(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const productsData = await productsAPI.getProducts();
      // Load variants for each product
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
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadAllInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (warehouses.length === 0) {
        setInventoryItems([]);
        setLoading(false);
        return;
      }
      
      const warehouseIds = warehouses.map((w) => w.id);
      const allItems: InventoryItem[] = [];
      
      for (const warehouseId of warehouseIds) {
        try {
          const items = await inventoryAPI.getInventoryByWarehouse(warehouseId);
          allItems.push(...items);
        } catch (err) {
          console.error(`Failed to load inventory for warehouse ${warehouseId}:`, err);
        }
      }
      
      setInventoryItems(allItems);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryByWarehouse = async (warehouseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getInventoryByWarehouse(warehouseId);
      setInventoryItems(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const addValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      productVariantId: '',
      warehouseId: '',
      quantity: 1,
      itemType: InventoryItemType.FINISHED_GOOD,
      reason: '',
    },
    validationSchema: Yup.object({
      productVariantId: Yup.string().required('Product variant is required'),
      warehouseId: Yup.string().required('Warehouse is required'),
      quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
      itemType: Yup.string().required('Item type is required'),
      reason: Yup.string().required('Reason is required'),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const data: AddInventoryDto = {
          productVariantId: values.productVariantId,
          warehouseId: values.warehouseId,
          quantity: values.quantity,
          itemType: values.itemType as InventoryItemType,
          reason: values.reason,
        };
        await inventoryAPI.addInventory(data);
        toast.success('Stock added successfully');
        setIsAddModalOpen(false);
        addValidation.resetForm();
        if (filterWarehouse) {
          loadInventoryByWarehouse(filterWarehouse);
        } else {
          loadAllInventory();
        }
      } catch (error) {
        console.error('Failed to add stock:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to add stock');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const deductValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      productVariantId: '',
      warehouseId: '',
      quantity: 1,
      reason: '',
    },
    validationSchema: Yup.object({
      productVariantId: Yup.string().required('Product variant is required'),
      warehouseId: Yup.string().required('Warehouse is required'),
      quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
      reason: Yup.string().required('Reason is required'),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const data: DeductInventoryDto = {
          productVariantId: values.productVariantId,
          warehouseId: values.warehouseId,
          quantity: values.quantity,
          reason: values.reason,
        };
        await inventoryAPI.deductInventory(data);
        toast.success('Stock deducted successfully');
        setIsDeductModalOpen(false);
        deductValidation.resetForm();
        if (filterWarehouse) {
          loadInventoryByWarehouse(filterWarehouse);
        } else {
          loadAllInventory();
        }
      } catch (error) {
        console.error('Failed to deduct stock:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to deduct stock');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Get all variants from all products
  const allVariants = products.flatMap((product) =>
    (product.variants || []).map((variant: any) => ({
      ...variant,
      productName: product.name,
      productSku: product.sku,
    }))
  );

  const parseAttributes = (attributes?: string) => {
    if (!attributes) return null;
    try {
      return JSON.parse(attributes);
    } catch {
      return null;
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Inventory Overview" pageTitle="Inventory" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Inventory Overview</h5>
                  <div className="d-flex gap-2">
                    <Button
                      color="success"
                      className="btn-sm"
                      onClick={() => setIsAddModalOpen(true)}
                      disabled={submitting}
                    >
                      <FeatherIcon icon="plus" className="me-1" size={16} />
                      Add Stock
                    </Button>
                    <Button
                      color="warning"
                      className="btn-sm"
                      onClick={() => setIsDeductModalOpen(true)}
                      disabled={submitting}
                    >
                      <FeatherIcon icon="minus" className="me-1" size={16} />
                      Deduct Stock
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={4}>
                      <Label className="form-label">Filter by Warehouse</Label>
                      <Input
                        type="select"
                        value={filterWarehouse}
                        onChange={(e) => setFilterWarehouse(e.target.value)}
                        disabled={loadingWarehouses}
                      >
                        <option value="">All Warehouses</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.location}
                          </option>
                        ))}
                      </Input>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading inventory...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={() => filterWarehouse ? loadInventoryByWarehouse(filterWarehouse) : loadAllInventory()}>
                        Retry
                      </Button>
                    </div>
                  ) : inventoryItems.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="package" size={64} />
                      </div>
                      <h5>No Inventory Found</h5>
                      <p className="text-muted">
                        {filterWarehouse
                          ? 'No inventory items found in this warehouse.'
                          : 'No inventory items found. Start by adding stock.'}
                      </p>
                      <Button
                        color="primary"
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        <FeatherIcon icon="plus" className="me-1" size={16} />
                        Add Stock
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Product</th>
                            <th scope="col">Variant SKU</th>
                            <th scope="col">Warehouse</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">Item Type</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryItems.map((item) => {
                            const attrs = parseAttributes(item.productVariant.attributes);
                            return (
                              <tr key={item.id}>
                                <td>
                                  <div>
                                    <strong>{item.productVariant.product.name}</strong>
                                    <div className="text-muted small">SKU: {item.productVariant.product.sku}</div>
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <strong>{item.productVariant.sku}</strong>
                                    {attrs && (
                                      <div className="text-muted small">
                                        {Object.entries(attrs).map(([key, value]) => (
                                          <span key={key} className="me-2">
                                            {key}: {value as string}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div>
                                    <strong>{item.warehouse.name}</strong>
                                    <div className="text-muted small">{item.warehouse.location}</div>
                                  </div>
                                </td>
                                <td>
                                  <Badge
                                    color={
                                      item.quantity === 0
                                        ? 'danger'
                                        : item.quantity < 10
                                        ? 'warning'
                                        : 'success'
                                    }
                                    className="fs-6"
                                  >
                                    {item.quantity}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge color="soft-info">{item.itemType}</Badge>
                                </td>
                                <td className="text-end">
                                  <Link to={`/products/${item.productVariant.product.id}`}>
                                    <Button color="soft-primary" size="sm">
                                      <FeatherIcon icon="eye" size={14} />
                                    </Button>
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
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

      {/* Add Stock Modal */}
      <Modal isOpen={isAddModalOpen} toggle={() => setIsAddModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setIsAddModalOpen(false)}>Add Stock</ModalHeader>
        <ModalBody>
          <Form onSubmit={addValidation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="addProductVariantId" className="form-label">
                Product Variant <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                id="addProductVariantId"
                name="productVariantId"
                value={addValidation.values.productVariantId}
                onChange={addValidation.handleChange}
                onBlur={addValidation.handleBlur}
                invalid={addValidation.touched.productVariantId && !!addValidation.errors.productVariantId}
                disabled={submitting || loadingProducts}
              >
                <option value="">Select a product variant</option>
                {allVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.productName} - {variant.sku} {variant.attributes ? `(${variant.attributes})` : ''}
                  </option>
                ))}
              </Input>
              {addValidation.touched.productVariantId && addValidation.errors.productVariantId && (
                <FormFeedback type="invalid">{addValidation.errors.productVariantId}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label htmlFor="addWarehouseId" className="form-label">
                Warehouse <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                id="addWarehouseId"
                name="warehouseId"
                value={addValidation.values.warehouseId}
                onChange={addValidation.handleChange}
                onBlur={addValidation.handleBlur}
                invalid={addValidation.touched.warehouseId && !!addValidation.errors.warehouseId}
                disabled={submitting || loadingWarehouses}
              >
                <option value="">Select a warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.location}
                  </option>
                ))}
              </Input>
              {addValidation.touched.warehouseId && addValidation.errors.warehouseId && (
                <FormFeedback type="invalid">{addValidation.errors.warehouseId}</FormFeedback>
              )}
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Label htmlFor="addQuantity" className="form-label">
                  Quantity <span className="text-danger">*</span>
                </Label>
                <Input
                  type="number"
                  id="addQuantity"
                  name="quantity"
                  min="1"
                  value={addValidation.values.quantity}
                  onChange={addValidation.handleChange}
                  onBlur={addValidation.handleBlur}
                  invalid={addValidation.touched.quantity && !!addValidation.errors.quantity}
                  disabled={submitting}
                />
                {addValidation.touched.quantity && addValidation.errors.quantity && (
                  <FormFeedback type="invalid">{addValidation.errors.quantity}</FormFeedback>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <Label htmlFor="addItemType" className="form-label">
                  Item Type <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  id="addItemType"
                  name="itemType"
                  value={addValidation.values.itemType}
                  onChange={addValidation.handleChange}
                  onBlur={addValidation.handleBlur}
                  invalid={addValidation.touched.itemType && !!addValidation.errors.itemType}
                  disabled={submitting}
                >
                  <option value={InventoryItemType.RAW_MATERIAL}>Raw Material</option>
                  <option value={InventoryItemType.WIP}>Work In Progress</option>
                  <option value={InventoryItemType.FINISHED_GOOD}>Finished Good</option>
                </Input>
                {addValidation.touched.itemType && addValidation.errors.itemType && (
                  <FormFeedback type="invalid">{addValidation.errors.itemType}</FormFeedback>
                )}
              </div>
            </div>
            <div className="mb-3">
              <Label htmlFor="addReason" className="form-label">
                Reason <span className="text-danger">*</span>
              </Label>
              <Input
                type="textarea"
                id="addReason"
                name="reason"
                rows={3}
                placeholder="Enter reason for adding stock"
                value={addValidation.values.reason}
                onChange={addValidation.handleChange}
                onBlur={addValidation.handleBlur}
                invalid={addValidation.touched.reason && !!addValidation.errors.reason}
                disabled={submitting}
              />
              {addValidation.touched.reason && addValidation.errors.reason && (
                <FormFeedback type="invalid">{addValidation.errors.reason}</FormFeedback>
              )}
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                color="light"
                onClick={() => setIsAddModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="success"
                disabled={submitting || !addValidation.isValid}
              >
                {submitting ? 'Adding...' : 'Add Stock'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>

      {/* Deduct Stock Modal */}
      <Modal isOpen={isDeductModalOpen} toggle={() => setIsDeductModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setIsDeductModalOpen(false)}>Deduct Stock</ModalHeader>
        <ModalBody>
          <Form onSubmit={deductValidation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="deductProductVariantId" className="form-label">
                Product Variant <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                id="deductProductVariantId"
                name="productVariantId"
                value={deductValidation.values.productVariantId}
                onChange={deductValidation.handleChange}
                onBlur={deductValidation.handleBlur}
                invalid={deductValidation.touched.productVariantId && !!deductValidation.errors.productVariantId}
                disabled={submitting || loadingProducts}
              >
                <option value="">Select a product variant</option>
                {allVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.productName} - {variant.sku}
                  </option>
                ))}
              </Input>
              {deductValidation.touched.productVariantId && deductValidation.errors.productVariantId && (
                <FormFeedback type="invalid">{deductValidation.errors.productVariantId}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label htmlFor="deductWarehouseId" className="form-label">
                Warehouse <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                id="deductWarehouseId"
                name="warehouseId"
                value={deductValidation.values.warehouseId}
                onChange={deductValidation.handleChange}
                onBlur={deductValidation.handleBlur}
                invalid={deductValidation.touched.warehouseId && !!deductValidation.errors.warehouseId}
                disabled={submitting || loadingWarehouses}
              >
                <option value="">Select a warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} - {warehouse.location}
                  </option>
                ))}
              </Input>
              {deductValidation.touched.warehouseId && deductValidation.errors.warehouseId && (
                <FormFeedback type="invalid">{deductValidation.errors.warehouseId}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label htmlFor="deductQuantity" className="form-label">
                Quantity <span className="text-danger">*</span>
              </Label>
              <Input
                type="number"
                id="deductQuantity"
                name="quantity"
                min="1"
                value={deductValidation.values.quantity}
                onChange={deductValidation.handleChange}
                onBlur={deductValidation.handleBlur}
                invalid={deductValidation.touched.quantity && !!deductValidation.errors.quantity}
                disabled={submitting}
              />
              {deductValidation.touched.quantity && deductValidation.errors.quantity && (
                <FormFeedback type="invalid">{deductValidation.errors.quantity}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label htmlFor="deductReason" className="form-label">
                Reason <span className="text-danger">*</span>
              </Label>
              <Input
                type="textarea"
                id="deductReason"
                name="reason"
                rows={3}
                placeholder="Enter reason for deducting stock"
                value={deductValidation.values.reason}
                onChange={deductValidation.handleChange}
                onBlur={deductValidation.handleBlur}
                invalid={deductValidation.touched.reason && !!deductValidation.errors.reason}
                disabled={submitting}
              />
              {deductValidation.touched.reason && deductValidation.errors.reason && (
                <FormFeedback type="invalid">{deductValidation.errors.reason}</FormFeedback>
              )}
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                color="light"
                onClick={() => setIsDeductModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="warning"
                disabled={submitting || !deductValidation.isValid}
              >
                {submitting ? 'Deducting...' : 'Deduct Stock'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default InventoryOverview;

