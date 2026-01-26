import React, { useState } from 'react';
import { Table, Button, Modal, ModalHeader, ModalBody, Form, Label, Input, FormFeedback, Badge } from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FeatherIcon from 'feather-icons-react';
import { ProductWithVariants, productsAPI, CreateBomDto } from '../../../api/products';
import { toast } from 'react-toastify';

interface BomTabProps {
  product: ProductWithVariants;
  onReload: () => void;
}

interface BomComponent {
  id: string;
  componentName: string;
  category: string;
  quantity: number;
  unit: string;
  parentVariantSku: string;
  componentVariantSku: string;
  componentVariantId: string;
  parentVariantId: string;
}

const BomTab: React.FC<BomTabProps> = ({ product, onReload }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableVariants = product.variants || [];

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      parentVariantId: '',
      componentName: '',
      category: 'Fabric',
      quantity: 1,
      unit: 'm',
      componentVariantId: '',
    },
    validationSchema: Yup.object({
      parentVariantId: Yup.string().required('Parent variant is required'),
      componentName: Yup.string().required('Component name is required'),
      category: Yup.string().required('Category is required'),
      quantity: Yup.number().min(0.01, 'Quantity must be greater than 0').required('Quantity is required'),
      unit: Yup.string().required('Unit is required'),
      componentVariantId: Yup.string().required('Component variant is required'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const data: CreateBomDto = {
          componentVariantId: values.componentVariantId,
          quantity: values.quantity,
        };
        await productsAPI.createBom(values.parentVariantId, data);
        toast.success('BOM component added successfully');
        setIsAddModalOpen(false);
        validation.resetForm();
        onReload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to add BOM component');
      } finally {
        setLoading(false);
      }
    },
  });

  // Collect all BOM entries and format them for display
  const bomComponents: BomComponent[] = product.variants?.flatMap((variant) =>
    variant.bomAsParent?.map((bom) => {
      // Try to extract component name from variant attributes or use SKU
      let componentName = bom.componentVariant?.sku || 'Unknown';
      try {
        const attrs = bom.componentVariant?.attributes ? JSON.parse(bom.componentVariant.attributes) : null;
        if (attrs) {
          componentName = `${attrs.color || ''} ${attrs.size || ''}`.trim() || componentName;
        }
      } catch {
        // Use SKU if parsing fails
      }

      return {
        id: bom.id,
        componentName,
        category: 'Fabric', // Default category, can be enhanced later
        quantity: bom.quantity,
        unit: 'm', // Default unit, can be enhanced later
        parentVariantSku: variant.sku,
        componentVariantSku: bom.componentVariant?.sku || '',
        componentVariantId: bom.componentVariantId,
        parentVariantId: bom.parentVariantId,
      };
    }) || []
  ) || [];

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      Fabric: 'primary',
      Trim: 'success',
      Packaging: 'info',
      Other: 'secondary',
    };
    return categoryColors[category] || 'secondary';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Bill of Materials</h6>
        <Button color="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <FeatherIcon icon="plus" size={14} className="me-1" />
          Add Component
        </Button>
      </div>

      {bomComponents.length > 0 ? (
        <div className="table-responsive">
          <Table className="table-nowrap align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Component Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Parent Variant</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bomComponents.map((bom) => (
                <tr key={bom.id}>
                  <td>
                    <strong>{bom.componentName}</strong>
                  </td>
                  <td>
                    <Badge color={getCategoryBadge(bom.category)}>{bom.category}</Badge>
                  </td>
                  <td>{bom.quantity}</td>
                  <td>{bom.unit}</td>
                  <td>
                    <code className="text-muted">{bom.parentVariantSku}</code>
                  </td>
                  <td className="text-end">
                    <Button color="danger" size="sm">
                      <FeatherIcon icon="trash-2" size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-muted mb-3">
            <FeatherIcon icon="package" size={48} />
          </div>
          <p className="text-muted">No BOM components found. Add components to build your bill of materials.</p>
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
                {product.variants?.map((variant) => {
                  let displayName = variant.sku;
                  try {
                    const attrs = variant.attributes ? JSON.parse(variant.attributes) : null;
                    if (attrs && attrs.color && attrs.size) {
                      displayName = `${variant.sku} (${attrs.color} / ${attrs.size})`;
                    }
                  } catch {
                    // Use SKU if parsing fails
                  }
                  return (
                    <option key={variant.id} value={variant.id}>
                      {displayName}
                    </option>
                  );
                })}
              </Input>
              {validation.touched.parentVariantId && validation.errors.parentVariantId && (
                <FormFeedback type="invalid">{validation.errors.parentVariantId}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label className="form-label">Component Name *</Label>
              <Input
                type="text"
                name="componentName"
                value={validation.values.componentName}
                onChange={validation.handleChange}
                invalid={validation.touched.componentName && validation.errors.componentName ? true : false}
                placeholder="e.g., Cotton Fabric, Zipper, Label"
              />
              {validation.touched.componentName && validation.errors.componentName && (
                <FormFeedback type="invalid">{validation.errors.componentName}</FormFeedback>
              )}
            </div>
            <div className="mb-3">
              <Label className="form-label">Category *</Label>
              <Input
                type="select"
                name="category"
                value={validation.values.category}
                onChange={validation.handleChange}
                invalid={validation.touched.category && validation.errors.category ? true : false}
              >
                <option value="Fabric">Fabric</option>
                <option value="Trim">Trim</option>
                <option value="Packaging">Packaging</option>
                <option value="Other">Other</option>
              </Input>
              {validation.touched.category && validation.errors.category && (
                <FormFeedback type="invalid">{validation.errors.category}</FormFeedback>
              )}
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <Label className="form-label">Quantity per Unit *</Label>
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
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <Label className="form-label">Unit *</Label>
                  <Input
                    type="select"
                    name="unit"
                    value={validation.values.unit}
                    onChange={validation.handleChange}
                    invalid={validation.touched.unit && validation.errors.unit ? true : false}
                  >
                    <option value="m">m (meters)</option>
                    <option value="pcs">pcs (pieces)</option>
                    <option value="kg">kg (kilograms)</option>
                    <option value="g">g (grams)</option>
                    <option value="cm">cm (centimeters)</option>
                    <option value="other">Other</option>
                  </Input>
                  {validation.touched.unit && validation.errors.unit && (
                    <FormFeedback type="invalid">{validation.errors.unit}</FormFeedback>
                  )}
                </div>
              </div>
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
                {availableVariants.map((variant) => {
                  let displayName = variant.sku;
                  try {
                    const attrs = variant.attributes ? JSON.parse(variant.attributes) : null;
                    if (attrs && attrs.color && attrs.size) {
                      displayName = `${variant.sku} (${attrs.color} / ${attrs.size})`;
                    }
                  } catch {
                    // Use SKU if parsing fails
                  }
                  return (
                    <option key={variant.id} value={variant.id}>
                      {displayName}
                    </option>
                  );
                })}
              </Input>
              {validation.touched.componentVariantId && validation.errors.componentVariantId && (
                <FormFeedback type="invalid">{validation.errors.componentVariantId}</FormFeedback>
              )}
              <small className="text-muted">Select the variant that represents this component</small>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button type="button" color="light" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" color="primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Component'}
              </Button>
            </div>
          </Form>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default BomTab;
