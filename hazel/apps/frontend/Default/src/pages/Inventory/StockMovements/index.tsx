import React, { useEffect, useState } from 'react';
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
  Modal,
  ModalHeader,
  ModalBody,
  Form,
  FormFeedback,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { inventoryAPI, StockMovement, TransferInventoryDto } from '../../../api/inventory';
import { warehousesAPI } from '../../../api/warehouses';
import { productsAPI } from '../../../api/products';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const StockMovements: React.FC = () => {
  document.title = 'Stock Movements | Hazel Inventory';

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterWarehouse, setFilterWarehouse] = useState<string>('');
  const [filterVariant, setFilterVariant] = useState<string>('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStockMovements();
    loadWarehouses();
    loadProducts();
  }, []);

  useEffect(() => {
    loadStockMovements();
  }, [filterWarehouse, filterVariant]);

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

  const loadStockMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getStockMovements(
        filterVariant || undefined,
        filterWarehouse || undefined
      );
      setMovements(data);
    } catch (err) {
      console.error('Failed to load stock movements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stock movements');
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const transferValidation = useFormik({
    enableReinitialize: true,
    initialValues: {
      productVariantId: '',
      fromWarehouseId: '',
      toWarehouseId: '',
      quantity: 1,
      reason: '',
    },
    validationSchema: Yup.object({
      productVariantId: Yup.string().required('Product variant is required'),
      fromWarehouseId: Yup.string().required('Source warehouse is required'),
      toWarehouseId: Yup.string()
        .required('Destination warehouse is required')
        .notOneOf([Yup.ref('fromWarehouseId')], 'Destination must be different from source'),
      quantity: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
      reason: Yup.string().required('Reason is required'),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const data: TransferInventoryDto = {
          productVariantId: values.productVariantId,
          fromWarehouseId: values.fromWarehouseId,
          toWarehouseId: values.toWarehouseId,
          quantity: values.quantity,
          reason: values.reason,
        };
        await inventoryAPI.transferInventory(data);
        toast.success('Stock transferred successfully');
        setIsTransferModalOpen(false);
        transferValidation.resetForm();
        loadStockMovements();
      } catch (error) {
        console.error('Failed to transfer stock:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to transfer stock');
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

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Stock Movements" pageTitle="Inventory" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Stock Movements</h5>
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={() => setIsTransferModalOpen(true)}
                    disabled={submitting}
                  >
                    <FeatherIcon icon="arrow-left-right" className="me-1" size={16} />
                    Transfer Stock
                  </Button>
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
                    <Col md={4}>
                      <Label className="form-label">Filter by Product Variant</Label>
                      <Input
                        type="select"
                        value={filterVariant}
                        onChange={(e) => setFilterVariant(e.target.value)}
                        disabled={loadingProducts}
                      >
                        <option value="">All Variants</option>
                        {allVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.productName} - {variant.sku}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={4} className="d-flex align-items-end">
                      <Button
                        color="light"
                        onClick={() => {
                          setFilterWarehouse('');
                          setFilterVariant('');
                        }}
                        disabled={!filterWarehouse && !filterVariant}
                      >
                        Clear Filters
                      </Button>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading stock movements...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadStockMovements}>
                        Retry
                      </Button>
                    </div>
                  ) : movements.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="activity" size={64} />
                      </div>
                      <h5>No Stock Movements Found</h5>
                      <p className="text-muted">
                        {filterWarehouse || filterVariant
                          ? 'No stock movements match your filters.'
                          : 'No stock movements recorded yet.'}
                      </p>
                      {!filterWarehouse && !filterVariant && (
                        <Button
                          color="primary"
                          onClick={() => setIsTransferModalOpen(true)}
                        >
                          <FeatherIcon icon="arrow-left-right" className="me-1" size={16} />
                          Transfer Stock
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Product</th>
                            <th scope="col">Variant SKU</th>
                            <th scope="col">Warehouse</th>
                            <th scope="col">Change</th>
                            <th scope="col">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movements.map((movement) => (
                            <tr key={movement.id}>
                              <td>
                                {new Date(movement.createdAt).toLocaleString()}
                              </td>
                              <td>
                                <div>
                                  <strong>{movement.inventoryItem.productVariant.product.name}</strong>
                                  <div className="text-muted small">SKU: {movement.inventoryItem.productVariant.product.sku}</div>
                                </div>
                              </td>
                              <td>
                                <strong>{movement.inventoryItem.productVariant.sku}</strong>
                              </td>
                              <td>
                                <div>
                                  <strong>{movement.inventoryItem.warehouse.name}</strong>
                                  <div className="text-muted small">{movement.inventoryItem.warehouse.location}</div>
                                </div>
                              </td>
                              <td>
                                <Badge
                                  color={movement.changeQuantity > 0 ? 'success' : 'danger'}
                                  className="fs-6"
                                >
                                  {movement.changeQuantity > 0 ? '+' : ''}{movement.changeQuantity}
                                </Badge>
                              </td>
                              <td>
                                <span className="text-muted">{movement.reason}</span>
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

      {/* Transfer Stock Modal */}
      <Modal isOpen={isTransferModalOpen} toggle={() => setIsTransferModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setIsTransferModalOpen(false)}>Transfer Stock</ModalHeader>
        <ModalBody>
          <Form onSubmit={transferValidation.handleSubmit}>
            <div className="mb-3">
              <Label htmlFor="transferProductVariantId" className="form-label">
                Product Variant <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                id="transferProductVariantId"
                name="productVariantId"
                value={transferValidation.values.productVariantId}
                onChange={transferValidation.handleChange}
                onBlur={transferValidation.handleBlur}
                invalid={transferValidation.touched.productVariantId && !!transferValidation.errors.productVariantId}
                disabled={submitting || loadingProducts}
              >
                <option value="">Select a product variant</option>
                {allVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.productName} - {variant.sku}
                  </option>
                ))}
              </Input>
              {transferValidation.touched.productVariantId && transferValidation.errors.productVariantId && (
                <FormFeedback type="invalid">{transferValidation.errors.productVariantId}</FormFeedback>
              )}
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Label htmlFor="fromWarehouseId" className="form-label">
                  From Warehouse <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  id="fromWarehouseId"
                  name="fromWarehouseId"
                  value={transferValidation.values.fromWarehouseId}
                  onChange={transferValidation.handleChange}
                  onBlur={transferValidation.handleBlur}
                  invalid={transferValidation.touched.fromWarehouseId && !!transferValidation.errors.fromWarehouseId}
                  disabled={submitting || loadingWarehouses}
                >
                  <option value="">Select source warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </Input>
                {transferValidation.touched.fromWarehouseId && transferValidation.errors.fromWarehouseId && (
                  <FormFeedback type="invalid">{transferValidation.errors.fromWarehouseId}</FormFeedback>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <Label htmlFor="toWarehouseId" className="form-label">
                  To Warehouse <span className="text-danger">*</span>
                </Label>
                <Input
                  type="select"
                  id="toWarehouseId"
                  name="toWarehouseId"
                  value={transferValidation.values.toWarehouseId}
                  onChange={transferValidation.handleChange}
                  onBlur={transferValidation.handleBlur}
                  invalid={transferValidation.touched.toWarehouseId && !!transferValidation.errors.toWarehouseId}
                  disabled={submitting || loadingWarehouses}
                >
                  <option value="">Select destination warehouse</option>
                  {warehouses
                    .filter((w) => w.id !== transferValidation.values.fromWarehouseId)
                    .map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                </Input>
                {transferValidation.touched.toWarehouseId && transferValidation.errors.toWarehouseId && (
                  <FormFeedback type="invalid">{transferValidation.errors.toWarehouseId}</FormFeedback>
                )}
              </div>
            </div>
            <div className="mb-3">
              <Label htmlFor="transferQuantity" className="form-label">
                Quantity <span className="text-danger">*</span>
              </Label>
              <Input
                type="number"
                id="transferQuantity"
                name="quantity"
                min="1"
                value={transferValidation.values.quantity}
                onChange={transferValidation.handleChange}
                onBlur={transferValidation.handleBlur}
                invalid={transferValidation.touched.quantity && !!transferValidation.errors.quantity}
                disabled={submitting}
              />
              {transferValidation.touched.quantity && transferValidation.errors.quantity && (
                <FormFeedback type="invalid">{transferValidation.errors.quantity}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label htmlFor="transferReason" className="form-label">
                Reason <span className="text-danger">*</span>
              </Label>
              <Input
                type="textarea"
                id="transferReason"
                name="reason"
                rows={3}
                placeholder="Enter reason for transfer"
                value={transferValidation.values.reason}
                onChange={transferValidation.handleChange}
                onBlur={transferValidation.handleBlur}
                invalid={transferValidation.touched.reason && !!transferValidation.errors.reason}
                disabled={submitting}
              />
              {transferValidation.touched.reason && transferValidation.errors.reason && (
                <FormFeedback type="invalid">{transferValidation.errors.reason}</FormFeedback>
              )}
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                color="light"
                onClick={() => setIsTransferModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={submitting || !transferValidation.isValid}
              >
                {submitting ? 'Transferring...' : 'Transfer Stock'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default StockMovements;

