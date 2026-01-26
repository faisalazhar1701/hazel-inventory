import React, { useState } from 'react';
import { Table, Button, Badge, Card, CardBody } from 'reactstrap';
import FeatherIcon from 'feather-icons-react';
import { ProductWithVariants } from '../../../api/products';
import AssetList from '../../../Components/Assets/AssetList';

interface VariantsTabProps {
  product: ProductWithVariants;
  onReload: () => void;
}

const VariantsTab: React.FC<VariantsTabProps> = ({ product }) => {
  const [expandedVariantId, setExpandedVariantId] = useState<string | null>(null);

  const parseAttributes = (attributes?: string) => {
    if (!attributes) return null;
    try {
      return JSON.parse(attributes);
    } catch {
      return null;
    }
  };

  const getVariantDisplay = (variant: any) => {
    const attrs = parseAttributes(variant.attributes);
    if (attrs && attrs.color && attrs.size) {
      return (
        <div>
          <Badge color="primary" className="me-2">
            {attrs.color}
          </Badge>
          <Badge color="info">
            {attrs.size}
          </Badge>
        </div>
      );
    }
    return <span className="text-muted">-</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Product Variants</h6>
        <div className="text-muted small">
          {product.variants?.length || 0} variant{product.variants?.length !== 1 ? 's' : ''}
        </div>
      </div>

      {product.variants && product.variants.length > 0 ? (
        <div className="table-responsive">
          <Table className="table-nowrap align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>SKU</th>
                <th>Color</th>
                <th>Size</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => {
                const attrs = parseAttributes(variant.attributes);
                const isExpanded = expandedVariantId === variant.id;
                return (
                  <React.Fragment key={variant.id}>
                    <tr>
                      <td>
                        <strong>{variant.sku}</strong>
                      </td>
                      <td>
                        {attrs?.color ? (
                          <Badge color="primary">{attrs.color}</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {attrs?.size ? (
                          <Badge color="info">{attrs.size}</Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{new Date(variant.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <Button
                          color="info"
                          size="sm"
                          onClick={() => setExpandedVariantId(isExpanded ? null : variant.id)}
                        >
                          <FeatherIcon icon={isExpanded ? "chevron-up" : "chevron-down"} size={14} className="me-1" />
                          {isExpanded ? 'Hide' : 'Show'} Assets
                        </Button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5}>
                          <Card className="mt-2 mb-2">
                            <CardBody>
                              <AssetList entityType="VARIANT" entityId={variant.id} />
                            </CardBody>
                          </Card>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-muted mb-3">
            <FeatherIcon icon="layers" size={48} />
          </div>
          <p className="text-muted">No variants found. Variants can be added during product creation.</p>
        </div>
      )}
    </div>
  );
};

export default VariantsTab;
