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

  const getColorBadge = (color: string) =>
    color ? <Badge color="primary">{color}</Badge> : <span className="text-muted">-</span>;

  const getSizeBadge = (size?: string) =>
    size ? <Badge color="info">{size}</Badge> : <span className="text-muted">-</span>;

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
                const isExpanded = expandedVariantId === variant.id;
                return (
                  <React.Fragment key={variant.id}>
                    <tr>
                      <td>
                        <strong>{variant.sku}</strong>
                      </td>
                      <td>{getColorBadge(variant.color)}</td>
                      <td>{getSizeBadge(variant.size)}</td>
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
