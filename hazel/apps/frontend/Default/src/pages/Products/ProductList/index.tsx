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
} from 'reactstrap';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { productsAPI, Product } from '../../../api/products';
import FeatherIcon from 'feather-icons-react';

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                  <Link to="/products/create">
                    <Button color="primary" className="btn-sm">
                      <FeatherIcon icon="plus" className="me-1" size={16} />
                      Create Product
                    </Button>
                  </Link>
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
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-nowrap align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th scope="col">SKU</th>
                            <th scope="col">Name</th>
                            <th scope="col">Description</th>
                            <th scope="col">Status</th>
                            <th scope="col">Created</th>
                            <th scope="col" className="text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => (
                            <tr key={product.id}>
                              <td>
                                <strong>{product.sku}</strong>
                              </td>
                              <td>{product.name}</td>
                              <td>
                                <span className="text-muted">
                                  {product.description || '-'}
                                </span>
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

