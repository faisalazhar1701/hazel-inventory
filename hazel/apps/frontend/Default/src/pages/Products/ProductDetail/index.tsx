import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Spinner,
  Badge,
} from 'reactstrap';
import classnames from 'classnames';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { productsAPI, ProductWithVariants } from '../../../api/products';
import ProductInfoTab from './ProductInfoTab';
import VariantsTab from './VariantsTab';
import BomTab from './BomTab';
import LifecycleTab from './LifecycleTab';
import MerchandisingTab from './MerchandisingTab';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    if (id) {
      document.title = `Product Detail | Hazel Inventory`;
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await productsAPI.getProductById(id);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
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

  if (loading) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <Spinner color="primary" />
            <p className="mt-2">Loading product...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-content">
        <Container fluid>
          <div className="text-center py-5">
            <p className="text-danger">{error || 'Product not found'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>
              Back to Products
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Product Detail" pageTitle="Products" />
          <Row>
            <Col>
              <Card>
                <CardHeader>
                  <Row className="align-items-center">
                    <Col>
                      <h5 className="card-title mb-0">
                        {product.name} {getStatusBadge(product.lifecycleStatus)}
                      </h5>
                      <p className="text-muted mb-0">SKU: {product.sku}</p>
                    </Col>
                  </Row>
                </CardHeader>
                <CardBody>
                  <Nav tabs className="nav-tabs-custom">
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === '1' })}
                        onClick={() => setActiveTab('1')}
                      >
                        Product Info
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === '2' })}
                        onClick={() => setActiveTab('2')}
                      >
                        Variants
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === '3' })}
                        onClick={() => setActiveTab('3')}
                      >
                        BOM
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === '4' })}
                        onClick={() => setActiveTab('4')}
                      >
                        Lifecycle
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === '5' })}
                        onClick={() => setActiveTab('5')}
                      >
                        Merchandising
                      </NavLink>
                    </NavItem>
                  </Nav>
                  <TabContent activeTab={activeTab} className="p-3">
                    <TabPane tabId="1">
                      <ProductInfoTab product={product} onReload={loadProduct} />
                    </TabPane>
                    <TabPane tabId="2">
                      <VariantsTab product={product} onReload={loadProduct} />
                    </TabPane>
                    <TabPane tabId="3">
                      <BomTab product={product} onReload={loadProduct} />
                    </TabPane>
                    <TabPane tabId="4">
                      <LifecycleTab product={product} onReload={loadProduct} />
                    </TabPane>
                    <TabPane tabId="5">
                      <MerchandisingTab product={product} onReload={loadProduct} />
                    </TabPane>
                  </TabContent>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default ProductDetail;

