import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, Spinner, Row, Col, CardHeader } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { inventoryApi, InventoryItemResponse } from '../../../api/inventory';
import { productsApi, ProductVariantResponse } from '../../../api/products';

const ProductInventoryView: React.FC = () => {
  const params = useParams<{ _id?: string; id?: string }>();
  const productId = params._id || params.id;
  const [variants, setVariants] = useState<ProductVariantResponse[]>([]);
  const [inventoryData, setInventoryData] = useState<Record<string, InventoryItemResponse[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      setIsLoading(true);
      setError(null);
      
      // Fetch product variants
      productsApi
        .getProductVariants(productId)
        .then((variantsData) => {
          setVariants(variantsData);
          
          // Fetch inventory for each variant
          const inventoryPromises = variantsData.map((variant) =>
            inventoryApi
              .getInventoryByProductVariant(variant.id)
              .then((inventory) => ({ variantId: variant.id, inventory }))
              .catch(() => ({ variantId: variant.id, inventory: [] }))
          );

          return Promise.all(inventoryPromises);
        })
        .then((results) => {
          const inventoryMap: Record<string, InventoryItemResponse[]> = {};
          results.forEach(({ variantId, inventory }) => {
            inventoryMap[variantId] = inventory;
          });
          setInventoryData(inventoryMap);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching inventory:', err);
          setError('Failed to load inventory data');
          setIsLoading(false);
        });
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner color="primary" />
        <p className="text-muted mt-2">Loading inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">Product ID not available.</p>
      </div>
    );
  }

  if (variants.length === 0 && !isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No variants found for this product.</p>
      </div>
    );
  }

  return (
    <div>
      {variants.map((variant) => {
        const inventory = inventoryData[variant.id] || [];
        const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);

        return (
          <Card key={variant.id} className="mb-4">
            <CardHeader>
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">
                    Variant: {variant.sku}
                    {variant.color && <span className="text-muted ms-2">({variant.color})</span>}
                    {variant.size && <span className="text-muted ms-2">Size: {variant.size}</span>}
                  </h5>
                </Col>
                <Col xs="auto">
                  <span className="badge bg-primary">Total: {totalQuantity}</span>
                </Col>
              </Row>
            </CardHeader>
            <CardBody>
              {inventory.length === 0 ? (
                <p className="text-muted mb-0">No inventory found for this variant.</p>
              ) : (
                <div className="table-responsive">
                  <Table className="table mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Warehouse</th>
                        <th>Location</th>
                        <th>Quantity</th>
                        <th>Item Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <span className="fw-medium">{item.warehouse.name}</span>
                          </td>
                          <td>
                            <span className="text-muted">{item.warehouse.location}</span>
                          </td>
                          <td>
                            <span className="badge bg-success-subtle text-success">
                              {item.quantity}
                            </span>
                          </td>
                          <td>
                            <span className="text-muted">{item.itemType}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductInventoryView;

