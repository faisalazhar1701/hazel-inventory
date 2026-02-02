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
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import classnames from 'classnames';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import { productsAPI, ProductWithVariants } from '../../../api/products';
import FeatherIcon from 'feather-icons-react';
import { toast } from 'react-toastify';
import ProductInfoTab from './ProductInfoTab';
import VariantsTab from './VariantsTab';
import BomTab from './BomTab';
import LifecycleTab from './LifecycleTab';
import MerchandisingTab from './MerchandisingTab';
import AssetList from '../../../Components/Assets/AssetList';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('1');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      document.title = `Product Detail | Hazel Inventory`;
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDeleteClick = () => setDeleteModal(true);
  const handleDeleteCancel = () => setDeleteModal(false);
  const handleDeleteConfirm = async () => {
    if (!product?.id) return;
    setDeleting(true);
    try {
      await productsAPI.deleteProduct(product.id);
      toast.success('Product deleted');
      navigate('/products');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
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
                    </Col>
                    <Col xs="auto">
                      <Button color="danger" size="sm" outline onClick={handleDeleteClick} title="Delete product">
                        <FeatherIcon icon="trash-2" size={16} />
                      </Button>
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
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === '6' })}
                        onClick={() => setActiveTab('6')}
                      >
                        Assets
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
                    <TabPane tabId="6">
                      <AssetList entityType="PRODUCT" entityId={product.id} />
                    </TabPane>
                  </TabContent>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <Modal isOpen={deleteModal} toggle={handleDeleteCancel}>
        <ModalHeader toggle={handleDeleteCancel}>Delete Product</ModalHeader>
        <ModalBody>
          Are you sure you want to delete <strong>{product?.name}</strong>? Variants and BOM will be removed. This cannot be undone.
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={handleDeleteCancel} disabled={deleting}>Cancel</Button>
          <Button color="danger" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default ProductDetail;

