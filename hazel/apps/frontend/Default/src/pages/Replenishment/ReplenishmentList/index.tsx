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
} from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import {
  replenishmentAPI,
  ReplenishmentSuggestionResult,
  ReplenishmentSuggestion,
  GetReplenishmentSuggestionsParams,
} from '../../../api/replenishment';
import { productsAPI } from '../../../api/products';
import { warehousesAPI } from '../../../api/warehouses';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const ReplenishmentList: React.FC = () => {
  document.title = 'Replenishment Suggestions | Hazel Inventory';

  const [suggestions, setSuggestions] = useState<(ReplenishmentSuggestionResult | ReplenishmentSuggestion)[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productVariantFilter, setProductVariantFilter] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [daysFilter, setDaysFilter] = useState<30 | 60 | 90>(30);
  const [productVariants, setProductVariants] = useState<Array<{ id: string; sku: string; productName: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadProductVariants();
    loadWarehouses();
    loadSuggestions();
  }, []);

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

  const loadWarehouses = async () => {
    try {
      const data = await warehousesAPI.listWarehouses();
      setWarehouses(data.map(w => ({ id: w.id, name: w.name })));
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      toast.error('Failed to load warehouses');
    }
  };

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: GetReplenishmentSuggestionsParams = {
        productVariantId: productVariantFilter || undefined,
        warehouseId: warehouseFilter || undefined,
        days: daysFilter,
        // Don't generate by default - just fetch existing
      };

      const data = await replenishmentAPI.getSuggestions(params);
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load replenishment suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load replenishment suggestions');
      toast.error('Failed to load replenishment suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = () => {
    // Generate suggestions (backend will use forecasts)
    const params: GetReplenishmentSuggestionsParams = {
      generate: 'true',
      // Optional filters are applied server-side but we generate all suggestions
    };
    loadSuggestionsWithParams(params);
  };

  const loadSuggestionsWithParams = async (params: GetReplenishmentSuggestionsParams) => {
    try {
      setGenerating(true);
      setError(null);
      const data = await replenishmentAPI.getSuggestions(params);
      setSuggestions(data);
      toast.success('Replenishment suggestions generated successfully');
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
      toast.error('Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const getVariantDisplay = (suggestion: ReplenishmentSuggestionResult | ReplenishmentSuggestion): string => {
    if ('productVariant' in suggestion && suggestion.productVariant) {
      return `${suggestion.productVariant.product?.name || 'N/A'} - ${suggestion.productVariant.sku}`;
    }
    if ('productVariantSku' in suggestion && suggestion.productVariantSku) {
      const variant = productVariants.find(v => v.id === suggestion.productVariantId);
      return variant ? `${variant.productName} - ${variant.sku}` : suggestion.productVariantSku;
    }
    const variant = productVariants.find(v => v.id === suggestion.productVariantId);
    return variant ? `${variant.productName} - ${variant.sku}` : suggestion.productVariantId;
  };

  const getWarehouseDisplay = (suggestion: ReplenishmentSuggestionResult | ReplenishmentSuggestion) => {
    if ('warehouse' in suggestion && suggestion.warehouse) {
      return suggestion.warehouse.name;
    }
    if ('warehouseName' in suggestion && suggestion.warehouseName) {
      return suggestion.warehouseName;
    }
    const warehouse = warehouses.find(w => w.id === suggestion.warehouseId);
    return warehouse ? warehouse.name : suggestion.warehouseId;
  };

  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case 'BELOW_MINIMUM_THRESHOLD':
        return 'danger';
      case 'FORECAST_DEMAND':
        return 'warning';
      case 'LOW_STOCK':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const filteredSuggestions = suggestions.filter((suggestion) => {
    if (productVariantFilter && suggestion.productVariantId !== productVariantFilter) return false;
    if (warehouseFilter && suggestion.warehouseId !== warehouseFilter) return false;
    return true;
  });

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Replenishment Suggestions" pageTitle="Intelligence" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Replenishment Suggestions</h5>
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={handleGenerateSuggestions}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Spinner size="sm" className="me-1" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FeatherIcon icon="refresh-cw" className="me-1" size={16} />
                        Generate Suggestions
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={4}>
                      <Label className="form-label">Filter by Product Variant</Label>
                      <Input
                        type="select"
                        value={productVariantFilter}
                        onChange={(e) => setProductVariantFilter(e.target.value)}
                      >
                        <option value="">All Variants</option>
                        {productVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.productName} - {variant.sku}
                          </option>
                        ))}
                      </Input>
                    </Col>
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
                            {warehouse.name}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={3}>
                      <Label className="form-label">Period (Days)</Label>
                      <Input
                        type="select"
                        value={daysFilter}
                        onChange={(e) => {
                          const newDays = parseInt(e.target.value) as 30 | 60 | 90;
                          setDaysFilter(newDays);
                        }}
                      >
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </Input>
                    </Col>
                    <Col md={2} className="d-flex align-items-end gap-2">
                      <Button
                        color="primary"
                        onClick={() => loadSuggestions()}
                        disabled={loading}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        color="light"
                        onClick={() => {
                          setProductVariantFilter('');
                          setWarehouseFilter('');
                          setDaysFilter(30);
                          loadSuggestions();
                        }}
                      >
                        Clear
                      </Button>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading replenishment suggestions...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={() => loadSuggestions()}>
                        Retry
                      </Button>
                    </div>
                  ) : filteredSuggestions.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="package" size={64} />
                      </div>
                      <h5>No Replenishment Suggestions</h5>
                      <p className="text-muted">
                        {productVariantFilter || warehouseFilter
                          ? 'No suggestions match your filters. Try generating new suggestions.'
                          : 'No replenishment suggestions available. Generate suggestions based on forecasts and current inventory.'}
                      </p>
                      <Button color="primary" onClick={handleGenerateSuggestions} disabled={generating}>
                        <FeatherIcon icon="refresh-cw" className="me-1" size={16} />
                        Generate Suggestions
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Product Variant</th>
                            <th scope="col">Warehouse</th>
                            <th scope="col" className="text-end">Current Stock</th>
                            <th scope="col" className="text-end">Forecasted Demand</th>
                            <th scope="col" className="text-end">Recommended Quantity</th>
                            <th scope="col">Reason</th>
                            <th scope="col">Recommended Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSuggestions.map((suggestion, index) => {
                            const currentStock = 'currentStock' in suggestion ? suggestion.currentStock : 0;
                            const forecastQty = 'forecastQuantity' in suggestion ? suggestion.forecastQuantity : 0;
                            
                            return (
                              <tr key={`suggestion-${index}`}>
                                <td>
                                  <strong>{getVariantDisplay(suggestion)}</strong>
                                </td>
                                <td>{getWarehouseDisplay(suggestion)}</td>
                                <td className="text-end">
                                  <strong>{currentStock.toLocaleString()}</strong>
                                </td>
                                <td className="text-end">{forecastQty.toLocaleString()}</td>
                                <td className="text-end">
                                  <strong className="text-primary">
                                    {suggestion.recommendedQuantity.toLocaleString()}
                                  </strong>
                                </td>
                                <td>
                                  <Badge color={getReasonBadgeColor(suggestion.reason)}>
                                    {suggestion.reason.replace(/_/g, ' ')}
                                  </Badge>
                                </td>
                                <td>{new Date(suggestion.recommendedDate).toLocaleDateString()}</td>
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
    </React.Fragment>
  );
};

export default ReplenishmentList;

