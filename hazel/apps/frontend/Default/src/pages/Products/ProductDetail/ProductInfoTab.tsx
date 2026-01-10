import React from 'react';
import { Row, Col, Label } from 'reactstrap';
import { ProductWithVariants } from '../../../api/products';

interface ProductInfoTabProps {
  product: ProductWithVariants;
  onReload: () => void;
}

const ProductInfoTab: React.FC<ProductInfoTabProps> = ({ product }) => {
  return (
    <Row>
      <Col md={6}>
        <div className="mb-3">
          <Label className="form-label fw-semibold">Product Name</Label>
          <p>{product.name}</p>
        </div>
      </Col>
      <Col md={6}>
        <div className="mb-3">
          <Label className="form-label fw-semibold">SKU</Label>
          <p>{product.sku}</p>
        </div>
      </Col>
      <Col md={12}>
        <div className="mb-3">
          <Label className="form-label fw-semibold">Description</Label>
          <p>{product.description || '-'}</p>
        </div>
      </Col>
      <Col md={6}>
        <div className="mb-3">
          <Label className="form-label fw-semibold">Lifecycle Status</Label>
          <p>{product.lifecycleStatus}</p>
        </div>
      </Col>
      <Col md={6}>
        <div className="mb-3">
          <Label className="form-label fw-semibold">Created At</Label>
          <p>{new Date(product.createdAt).toLocaleString()}</p>
        </div>
      </Col>
      <Col md={6}>
        <div className="mb-3">
          <Label className="form-label fw-semibold">Updated At</Label>
          <p>{new Date(product.updatedAt).toLocaleString()}</p>
        </div>
      </Col>
      <Col md={6}>
        <div className="mb-3">
          <Label className="form-label fw-semibold">Total Variants</Label>
          <p>{product.variants?.length || 0}</p>
        </div>
      </Col>
    </Row>
  );
};

export default ProductInfoTab;

