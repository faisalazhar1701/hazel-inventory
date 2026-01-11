import React, { useEffect, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Table,
  Spinner,
  Badge,
  Input,
  Label,
  Button,
} from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { financeAPI, InventoryValuation as InventoryValuationType } from '../../../api/finance';
import { warehousesAPI } from '../../../api/warehouses';
import { productsAPI } from '../../../api/products';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const InventoryValuation: React.FC = () => {
  document.title = 'Inventory Valuation | Hazel Inventory';

  const [valuation, setValuation] = useState<InventoryValuationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productVariants, setProductVariants] = useState<Array<{ id: string; sku: string; productName: string }>>([]);
  
  // Filters
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [productVariantFilter, setProductVariantFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'warehouse' | 'variant'>('warehouse');

  useEffect(() => {
    loadWarehouses();
    loadProductVariants();
    loadValuation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadValuation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseFilter, productVariantFilter]);

  const loadWarehouses = async () => {
    try {
      const data = await warehousesAPI.listWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    }
  };

  const loadProductVariants = async () => {
    try {
      const products = await productsAPI.getProducts();
      const variantsList: Array<{ id: string; sku: string; productName: string }> = [];
      
      for (const product of products) {
        try {
          const variants = await productsAPI.listVariants(product.id);
          variants.forEach((variant: any) => {
            variantsList.push({
              id: variant.id,
              sku: variant.sku,
              productName: product.name,
            });
          });
        } catch {
          // Skip products with no variants or errors
        }
      }
      
      setProductVariants(variantsList);
    } catch (err) {
      console.error('Failed to load product variants:', err);
    }
  };

  const loadValuation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (warehouseFilter) params.warehouseId = warehouseFilter;
      if (productVariantFilter) params.productVariantId = productVariantFilter;
      
      const data = await financeAPI.getInventoryValuation(params);
      setValuation(data);
    } catch (err) {
      console.error('Failed to load inventory valuation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory valuation');
      toast.error('Failed to load inventory valuation');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setWarehouseFilter('');
    setProductVariantFilter('');
    setTimeout(() => {
      loadValuation();
    }, 0);
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Inventory Valuation" pageTitle="Finance & Accounting" />
          
          <Row>
            <Col>
              <Card>
                <CardHeader>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Inventory Valuation</h5>
                    {valuation && (
                      <div>
                        <Badge color="success" className="fs-6">
                          Total Value: {formatCurrency(valuation.totalValue, valuation.currency)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardBody>
                  {/* Filters */}
                  <Row className="mb-3">
                    <Col md={4}>
                      <Label className="form-label">Filter by Warehouse</Label>
                      <Input
                        type="select"
                        value={warehouseFilter}
                        onChange={(e) => setWarehouseFilter(e.target.value)}
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
                        value={productVariantFilter}
                        onChange={(e) => setProductVariantFilter(e.target.value)}
                      >
                        <option value="">All Product Variants</option>
                        {productVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.productName} - {variant.sku}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={4} className="d-flex align-items-end gap-2">
                      <Button
                        color="light"
                        onClick={handleClearFilters}
                        disabled={loading}
                      >
                        <FeatherIcon icon="x" className="me-1" size={14} />
                        Clear Filters
                      </Button>
                    </Col>
                  </Row>

                  {/* View Mode Toggle */}
                  <Row className="mb-3">
                    <Col>
                      <div className="btn-group" role="group">
                        <Button
                          color={viewMode === 'warehouse' ? 'primary' : 'light'}
                          onClick={() => setViewMode('warehouse')}
                        >
                          By Warehouse
                        </Button>
                        <Button
                          color={viewMode === 'variant' ? 'primary' : 'light'}
                          onClick={() => setViewMode('variant')}
                        >
                          By Product Variant
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading inventory valuation...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadValuation}>
                        Retry
                      </Button>
                    </div>
                  ) : !valuation ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="package" size={64} />
                      </div>
                      <h5>No Valuation Data Available</h5>
                      <p className="text-muted">No inventory valuation data found.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      {viewMode === 'warehouse' ? (
                        <Table className="table-nowrap align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th scope="col">Warehouse</th>
                              <th scope="col" className="text-end">Quantity on Hand</th>
                              <th scope="col" className="text-end">Inventory Value</th>
                              <th scope="col">Currency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {valuation.byWarehouse.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-5">
                                  <div className="text-muted">No warehouse valuation data available.</div>
                                </td>
                              </tr>
                            ) : (
                              valuation.byWarehouse.map((item) => (
                                <tr key={item.warehouseId}>
                                  <td>
                                    <div className="fw-medium">{item.warehouseName}</div>
                                  </td>
                                  <td className="text-end">
                                    <Badge color="info" className="fs-6">
                                      {item.totalQuantity.toLocaleString()}
                                    </Badge>
                                  </td>
                                  <td className="text-end fw-medium">
                                    {formatCurrency(item.estimatedValue, item.currency)}
                                  </td>
                                  <td>
                                    <Badge color="soft-info">{item.currency}</Badge>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      ) : (
                        <Table className="table-nowrap align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th scope="col">Product Variant</th>
                              <th scope="col" className="text-end">Quantity on Hand</th>
                              <th scope="col" className="text-end">Inventory Value</th>
                              <th scope="col">Currency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {valuation.byProductVariant.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="text-center py-5">
                                  <div className="text-muted">No product variant valuation data available.</div>
                                </td>
                              </tr>
                            ) : (
                              valuation.byProductVariant.map((item) => {
                                const variant = productVariants.find(v => v.id === item.productVariantId);
                                return (
                                  <tr key={item.productVariantId}>
                                    <td>
                                      <div>
                                        <div className="fw-medium">{variant?.productName || 'N/A'}</div>
                                        <div className="text-muted small">SKU: {item.productVariantSku}</div>
                                      </div>
                                    </td>
                                    <td className="text-end">
                                      <Badge color="info" className="fs-6">
                                        {item.totalQuantity.toLocaleString()}
                                      </Badge>
                                    </td>
                                    <td className="text-end fw-medium">
                                      {formatCurrency(item.estimatedValue, item.currency)}
                                    </td>
                                    <td>
                                      <Badge color="soft-info">{item.currency}</Badge>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </Table>
                      )}
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

export default InventoryValuation;
