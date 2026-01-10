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
import { forecastAPI, DemandForecastResult, DemandForecast, GetForecastsParams } from '../../../api/forecast';
import { productsAPI } from '../../../api/products';
import { OrderChannel } from '../../../api/orders';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

const ForecastList: React.FC = () => {
  document.title = 'Demand Forecasts | Hazel Inventory';

  const [forecasts, setForecasts] = useState<(DemandForecastResult | DemandForecast)[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productVariantFilter, setProductVariantFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [daysFilter, setDaysFilter] = useState<30 | 60 | 90>(30);
  const [productVariants, setProductVariants] = useState<Array<{ id: string; sku: string; productName: string }>>([]);

  useEffect(() => {
    loadProductVariants();
    loadForecasts();
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

  const loadForecasts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: GetForecastsParams = {
        productVariantId: productVariantFilter || undefined,
        channel: channelFilter || undefined,
        days: daysFilter,
        // Don't generate by default - just fetch existing
      };

      const data = await forecastAPI.getForecasts(params);
      setForecasts(data);
    } catch (err) {
      console.error('Failed to load forecasts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forecasts');
      toast.error('Failed to load forecasts');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForecast = () => {
    // Generate with days=30 by default (as per requirements)
    const params: GetForecastsParams = {
      days: 30,
      generate: 'true',
      // Optional filters are applied server-side but we generate all forecasts
    };
    loadForecastsWithParams(params);
  };

  const loadForecastsWithParams = async (params: GetForecastsParams) => {
    try {
      setGenerating(true);
      setError(null);
      const data = await forecastAPI.getForecasts(params);
      setForecasts(data);
      toast.success('Forecasts generated successfully');
    } catch (err) {
      console.error('Failed to generate forecasts:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate forecasts');
      toast.error('Failed to generate forecasts');
    } finally {
      setGenerating(false);
    }
  };

  const getVariantDisplay = (forecast: DemandForecastResult | DemandForecast) => {
    if ('productVariant' in forecast && forecast.productVariant) {
      const productName = forecast.productVariant.product?.name || 'N/A';
      const sku = forecast.productVariant.sku;
      return { name: productName, sku };
    }
    if ('productVariantSku' in forecast && forecast.productVariantSku) {
      const variant = productVariants.find(v => v.id === forecast.productVariantId);
      return variant ? { name: variant.productName, sku: variant.sku } : { name: 'N/A', sku: forecast.productVariantSku };
    }
    const variant = productVariants.find(v => v.id === forecast.productVariantId);
    return variant ? { name: variant.productName, sku: variant.sku } : { name: 'N/A', sku: forecast.productVariantId };
  };

  const calculatePeriodDays = (periodStart: string, periodEnd: string): number => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Round to nearest standard period (30, 60, or 90)
    if (diffDays <= 35) return 30;
    if (diffDays <= 75) return 60;
    return 90;
  };

  const getChannelBadgeColor = (channel?: string) => {
    if (!channel) return 'secondary';
    switch (channel) {
      case OrderChannel.DTC:
        return 'primary';
      case OrderChannel.B2B:
        return 'info';
      case OrderChannel.POS:
        return 'success';
      case OrderChannel.WHOLESALE:
        return 'warning';
      case OrderChannel.RETAIL:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const filteredForecasts = forecasts.filter((forecast) => {
    if (productVariantFilter && forecast.productVariantId !== productVariantFilter) return false;
    if (channelFilter && forecast.channel !== channelFilter) return false;
    return true;
  });

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Demand Forecasts" pageTitle="Intelligence" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Demand Forecasts</h5>
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={handleGenerateForecast}
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
                        Generate Forecast
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
                        onClick={() => loadForecasts()}
                        disabled={loading}
                      >
                        Apply Filters
                      </Button>
                      <Button
                        color="light"
                        onClick={() => {
                          setProductVariantFilter('');
                          setChannelFilter('');
                          setDaysFilter(30);
                          loadForecasts();
                        }}
                      >
                        Clear
                      </Button>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading forecasts...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={() => loadForecasts()}>
                        Retry
                      </Button>
                    </div>
                  ) : filteredForecasts.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="trending-up" size={64} />
                      </div>
                      <h5>No Forecasts Found</h5>
                      <p className="text-muted">
                        {productVariantFilter || channelFilter
                          ? 'No forecasts match your filters. Try generating new forecasts.'
                          : 'No forecasts available. Generate forecasts based on historical order data.'}
                      </p>
                      <Button color="primary" onClick={handleGenerateForecast} disabled={generating}>
                        <FeatherIcon icon="refresh-cw" className="me-1" size={16} />
                        Generate Forecast
                      </Button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">Product Variant</th>
                            <th scope="col" className="text-end">Forecast Quantity</th>
                            <th scope="col">Period</th>
                            <th scope="col">Channel</th>
                            <th scope="col">Period Start</th>
                            <th scope="col">Period End</th>
                            <th scope="col">Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredForecasts.map((forecast, index) => {
                            const variantDisplay = getVariantDisplay(forecast);
                            const periodDays = calculatePeriodDays(forecast.periodStart, forecast.periodEnd);
                            return (
                              <tr key={`forecast-${index}`}>
                                <td>
                                  <div>
                                    <strong>{variantDisplay.name}</strong>
                                    <br />
                                    <small className="text-muted">{variantDisplay.sku}</small>
                                  </div>
                                </td>
                                <td className="text-end">
                                  <strong>{forecast.forecastQuantity.toLocaleString()}</strong>
                                </td>
                                <td>
                                  <Badge color="info">{periodDays} days</Badge>
                                </td>
                                <td>
                                  {forecast.channel ? (
                                    <Badge color={getChannelBadgeColor(forecast.channel)}>
                                      {forecast.channel}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>{new Date(forecast.periodStart).toLocaleDateString()}</td>
                                <td>{new Date(forecast.periodEnd).toLocaleDateString()}</td>
                                <td>
                                  {'createdAt' in forecast && forecast.createdAt
                                    ? new Date(forecast.createdAt).toLocaleString()
                                    : <span className="text-muted">-</span>}
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
    </React.Fragment>
  );
};

export default ForecastList;

