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
  ButtonGroup,
} from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { productsAPI, Product } from '../../../api/products';
import FeatherIcon from 'feather-icons-react';

type ViewMode = 'grid' | 'list';

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    document.title = 'Products | Hazel Inventory';
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsAPI.listProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'secondary', label: 'Draft' },
      ACTIVE: { color: 'success', label: 'Active' },
      DISCONTINUED: { color: 'danger', label: 'Discontinued' },
    };
    const statusInfo = statusMap[status] || { color: 'secondary', label: status };
    return <Badge className={`badge-soft-${statusInfo.color}`}>{statusInfo.label}</Badge>;
  };

  const getVariantCount = (product: Product) => {
    return product.variants?.length || 0;
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Products" pageTitle="Products" />
          <Row>
            <Col>
              <Card>
                <CardHeader className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Product List</h5>
                  <div className="d-flex align-items-center gap-2">
                    <ButtonGroup>
                      <Button
                        color={viewMode === 'grid' ? 'primary' : 'light'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                      >
                        <FeatherIcon icon="grid" size={16} className="me-1" />
                        Grid View
                      </Button>
                      <Button
                        color={viewMode === 'list' ? 'primary' : 'light'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                      >
                        <FeatherIcon icon="list" size={16} className="me-1" />
                        List View
                      </Button>
                    </ButtonGroup>
                    <Link to="/products/create">
                      <Button color="primary" className="btn-sm">
                        <FeatherIcon icon="plus" className="me-1" size={16} />
                        Create Product
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                      <p className="mt-2">Loading products...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-5">
                      <div className="text-danger mb-2">
                        <FeatherIcon icon="alert-circle" size={48} />
                      </div>
                      <p className="text-danger">{error}</p>
                      <Button color="primary" onClick={loadProducts}>
                        Retry
                      </Button>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="text-muted mb-3">
                        <FeatherIcon icon="package" size={64} />
                      </div>
                      <h5>No Products Found</h5>
                      <p className="text-muted">Get started by creating your first product.</p>
                      <Link to="/products/create">
                        <Button color="primary">
                          <FeatherIcon icon="plus" className="me-1" size={16} />
                          Create Product
                        </Button>
                      </Link>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <Row>
                      {products.map((product) => (
                        <Col key={product.id} xl={3} lg={4} md={6} className="mb-4">
                          <Card className="h-100">
                            <div className="position-relative">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="card-img-top"
                                  style={{ height: '200px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  className="card-img-top d-flex align-items-center justify-content-center bg-light"
                                  style={{ height: '200px' }}
                                >
                                  <FeatherIcon icon="image" size={48} className="text-muted" />
                                </div>
                              )}
                              <div className="position-absolute top-0 end-0 m-2">
                                {getStatusBadge(product.lifecycleStatus)}
                              </div>
                            </div>
                            <CardBody>
                              <h5 className="card-title mb-2">{product.name}</h5>
                              <p className="text-muted small mb-2">
                                <code>{product.sku}</code>
                              </p>
                              {product.collection && (
                                <p className="text-muted small mb-2">
                                  <FeatherIcon icon="folder" size={12} className="me-1" />
                                  {product.collection.name}
                                </p>
                              )}
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="text-muted small">
                                  <FeatherIcon icon="layers" size={12} className="me-1" />
                                  {getVariantCount(product)} variant{getVariantCount(product) !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="d-flex gap-2">
                                <Link to={`/products/${product.id}`} className="flex-fill">
                                  <Button color="soft-primary" size="sm" className="w-100">
                                    <FeatherIcon icon="eye" size={14} className="me-1" />
                                    View
                                  </Button>
                                </Link>
                                <Link to={`/products/${product.id}`} className="flex-fill">
                                  <Button color="soft-info" size="sm" className="w-100">
                                    <FeatherIcon icon="edit" size={14} className="me-1" />
                                    Edit
                                  </Button>
                                </Link>
                                <Link to={`/products/${product.id}/inventory`} className="flex-fill">
                                  <Button color="soft-success" size="sm" className="w-100">
                                    <FeatherIcon icon="package" size={14} className="me-1" />
                                    Inventory
                                  </Button>
                                </Link>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" style={{ width: '80px' }}>Image</th>
                            <th scope="col">SKU</th>
                            <th scope="col">Name</th>
                            <th scope="col">Collection</th>
                            <th scope="col">Variants</th>
                            <th scope="col">Status</th>
                            <th scope="col">Created</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr key={product.id}>
                              <td>
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    className="rounded"
                                  />
                                ) : (
                                  <div
                                    className="d-flex align-items-center justify-content-center bg-light rounded"
                                    style={{ width: '50px', height: '50px' }}
                                  >
                                    <FeatherIcon icon="image" size={20} className="text-muted" />
                                  </div>
                                )}
                              </td>
                              <td>
                                <strong>{product.sku}</strong>
                              </td>
                              <td>{product.name}</td>
                              <td>
                                {product.collection ? (
                                  <span className="text-muted">
                                    <FeatherIcon icon="folder" size={12} className="me-1" />
                                    {product.collection.name}
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td>
                                <Badge color="info">
                                  <FeatherIcon icon="layers" size={12} className="me-1" />
                                  {getVariantCount(product)}
                                </Badge>
                              </td>
                              <td>{getStatusBadge(product.lifecycleStatus)}</td>
                              <td>
                                {new Date(product.createdAt).toLocaleDateString()}
                              </td>
                              <td className="text-end">
                                <Link to={`/products/${product.id}`}>
                                  <Button color="soft-primary" size="sm" className="me-1">
                                    <FeatherIcon icon="eye" size={14} />
                                  </Button>
                                </Link>
                                <Link to={`/products/${product.id}`}>
                                  <Button color="soft-info" size="sm" className="me-1">
                                    <FeatherIcon icon="edit" size={14} />
                                  </Button>
                                </Link>
                                <Link to={`/products/${product.id}/inventory`}>
                                  <Button color="soft-success" size="sm">
                                    <FeatherIcon icon="package" size={14} />
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

export default ProductList;
