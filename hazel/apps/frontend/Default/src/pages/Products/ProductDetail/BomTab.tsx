import React, { useState } from 'react';
import { Table, Button, Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FeatherIcon from 'feather-icons-react';
import { ProductWithVariants, productsAPI, CreateBomDto } from '../../../api/products';
import { toast } from 'react-toastify';

interface BomTabProps {
  product: ProductWithVariants;
  onReload: () => void;
}

const BomTab: React.FC<BomTabProps> = ({ product, onReload }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Use variants already loaded in product instead of making another API call
  const availableVariants = product.variants || [];

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      parentVariantId: '',
      componentVariantId: '',
      quantity: 1,
    },
    validationSchema: Yup.object({
      parentVariantId: Yup.string().required('Parent variant is required'),
      componentVariantId: Yup.string().required('Component variant is required'),
      quantity: Yup.number().min(0.01, 'Quantity must be greater than 0').required('Quantity is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const data: CreateBomDto = {
          componentVariantId: values.componentVariantId,
          quantity: values.quantity,
        };
        await productsAPI.createBom(values.parentVariantId, data);
        toast.success('BOM entry created successfully');
        setIsAddModalOpen(false);
        validation.resetForm();
        onReload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create BOM entry');
      } finally {
        setLoading(false);
      }
    },
  });

  // Collect all BOM entries from all variants
  const allBomEntries = product.variants?.flatMap((variant) =>
    variant.bomAsParent?.map((bom) => ({
      ...bom,
      parentVariant: variant,
    })) || []
  ) || [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Bill of Materials</h6>
        <Button color="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <FeatherIcon icon="plus" size={14} className="me-1" />
          Add BOM Component
        </Button>
      </div>

      {allBomEntries.length > 0 ? (
        <div className="table-responsive">
          <Table className="table-nowrap align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Parent Variant</th>
                <th>Component Variant</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {allBomEntries.map((bom) => (
                <tr key={bom.id}>
                  <td>
                    <strong>{bom.parentVariant?.sku || '-'}</strong>
                  </td>
                  <td>
                    <strong>{bom.componentVariant?.sku || '-'}</strong>
                  </td>
                  <td>{bom.quantity}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted">No BOM entries found. Add components to build your bill of materials.</p>
        </div>
      )}

      <Modal isOpen={isAddModalOpen} toggle={() => setIsAddModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setIsAddModalOpen(false)}>Add BOM Component</ModalHeader>
        <ModalBody>
          <Form onSubmit={validation.handleSubmit}>
              <div className="mb-3">
                <Label className="form-label">Parent Variant *</Label>
                <Input
                  type="select"
                  name="parentVariantId"
                  value={validation.values.parentVariantId}
                  onChange={validation.handleChange}
                  invalid={validation.touched.parentVariantId && validation.errors.parentVariantId ? true : false}
                >
                  <option value="">Select parent variant</option>
                  {product.variants?.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.sku}
                    </option>
                  ))}
                </Input>
                {validation.touched.parentVariantId && validation.errors.parentVariantId && (
                  <FormFeedback type="invalid">{validation.errors.parentVariantId}</FormFeedback>
                )}
              </div>
              <div className="mb-3">
                <Label className="form-label">Component Variant *</Label>
                <Input
                  type="select"
                  name="componentVariantId"
                  value={validation.values.componentVariantId}
                  onChange={validation.handleChange}
                  invalid={validation.touched.componentVariantId && validation.errors.componentVariantId ? true : false}
                >
                  <option value="">Select component variant</option>
                  {availableVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.sku}
                    </option>
                  ))}
                </Input>
                {validation.touched.componentVariantId && validation.errors.componentVariantId && (
                  <FormFeedback type="invalid">{validation.errors.componentVariantId}</FormFeedback>
                )}
              </div>
              <div className="mb-3">
                <Label className="form-label">Quantity *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="quantity"
                  value={validation.values.quantity}
                  onChange={validation.handleChange}
                  invalid={validation.touched.quantity && validation.errors.quantity ? true : false}
                />
                {validation.touched.quantity && validation.errors.quantity && (
                  <FormFeedback type="invalid">{validation.errors.quantity}</FormFeedback>
                )}
              </div>
              <div className="d-flex justify-content-end gap-2">
                <Button type="button" color="light" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" color="primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create BOM Entry'}
                </Button>
              </div>
            </Form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default BomTab;

