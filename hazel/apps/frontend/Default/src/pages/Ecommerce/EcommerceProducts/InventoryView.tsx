import React, { useEffect, useState } from 'react';
import { Card, CardBody, Table, Row, Col, Spinner } from 'reactstrap';
import { inventoryApi, InventoryItemResponse } from '../../../api/inventory';

interface InventoryViewProps {
  productVariantId: string;
}

const InventoryView: React.FC<InventoryViewProps> = ({ productVariantId }) => {
  const [inventory, setInventory] = useState<InventoryItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productVariantId) {
      setIsLoading(true);
      setError(null);
      inventoryApi
        .getInventoryByProductVariant(productVariantId)
        .then((data) => {
          setInventory(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching inventory:', err);
          setError('Failed to load inventory data');
          setIsLoading(false);
        });
    }
  }, [productVariantId]);

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

  if (inventory.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">No inventory found for this product variant.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardBody>
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
      </CardBody>
    </Card>
  );
};

export default InventoryView;

