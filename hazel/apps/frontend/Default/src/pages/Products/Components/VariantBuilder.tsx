import React, { useState, useCallback } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Row,
  Col,
  Label,
  Input,
  Button,
  Table,
  Badge,
  InputGroup,
} from 'reactstrap';
import FeatherIcon from 'feather-icons-react';

export interface VariantOption {
  color: string;
  size: string;
  sku?: string;
  price?: number;
  status?: 'Active' | 'Inactive';
}

interface VariantBuilderProps {
  productCode: string;
  variants: VariantOption[];
  onVariantsChange: (variants: VariantOption[]) => void;
}

const VariantBuilder: React.FC<VariantBuilderProps> = ({
  productCode,
  variants,
  onVariantsChange,
}) => {
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>(['XS', 'S', 'M', 'L', 'XL']);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');

  const generateSKU = useCallback(
    (color: string, size: string) => {
      const colorCode = color.toUpperCase().replace(/\s+/g, '-').substring(0, 5);
      const sizeCode = size.toUpperCase();
      return `${productCode}-${colorCode}-${sizeCode}`;
    },
    [productCode]
  );

  const addColor = useCallback(() => {
    const trimmed = colorInput.trim();
    if (trimmed && !colors.includes(trimmed)) {
      const newColors = [...colors, trimmed];
      setColors(newColors);
      setColorInput('');
    }
  }, [colorInput, colors]);

  const removeColor = useCallback(
    (colorToRemove: string) => {
      setColors(colors.filter((c) => c !== colorToRemove));
      // Remove variants with this color
      onVariantsChange(variants.filter((v) => v.color !== colorToRemove));
    },
    [colors, variants, onVariantsChange]
  );

  const addSize = useCallback(() => {
    const trimmed = sizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      const newSizes = [...sizes, trimmed];
      setSizes(newSizes);
      setSizeInput('');
    }
  }, [sizeInput, sizes]);

  const removeSize = useCallback(
    (sizeToRemove: string) => {
      setSizes(sizes.filter((s) => s !== sizeToRemove));
      // Remove variants with this size
      onVariantsChange(variants.filter((v) => v.size !== sizeToRemove));
    },
    [sizes, variants, onVariantsChange]
  );

  const generateVariants = useCallback(() => {
    if (colors.length === 0 || sizes.length === 0) {
      return;
    }

    const newVariants: VariantOption[] = [];
    colors.forEach((color) => {
      sizes.forEach((size) => {
        const existingVariant = variants.find(
          (v) => v.color === color && v.size === size
        );
        if (!existingVariant) {
          newVariants.push({
            color,
            size,
            sku: generateSKU(color, size),
            price: 0,
            status: 'Active',
          });
        }
      });
    });

    onVariantsChange([...variants, ...newVariants]);
  }, [colors, sizes, variants, generateSKU, onVariantsChange]);

  const updateVariant = useCallback(
    (index: number, field: keyof VariantOption, value: any) => {
      const updated = [...variants];
      updated[index] = { ...updated[index], [field]: value };
      onVariantsChange(updated);
    },
    [variants, onVariantsChange]
  );

  const removeVariant = useCallback(
    (index: number) => {
      onVariantsChange(variants.filter((_, i) => i !== index));
    },
    [variants, onVariantsChange]
  );

  return (
    <Card>
      <CardHeader>
        <h5 className="card-title mb-0">Variants</h5>
        <p className="text-muted mb-0 small">Create variants by combining colors and sizes</p>
      </CardHeader>
      <CardBody>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <Label className="form-label fw-semibold">Colors</Label>
              <InputGroup>
                <Input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addColor();
                    }
                  }}
                  placeholder="Type color and press Enter"
                />
                <Button color="primary" onClick={addColor}>
                  <FeatherIcon icon="plus" size={14} />
                </Button>
              </InputGroup>
              <div className="mt-2 d-flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Badge
                    key={color}
                    color="primary"
                    className="p-2 d-flex align-items-center gap-1"
                  >
                    {color}
                    <FeatherIcon
                      icon="x"
                      size={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => removeColor(color)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <Label className="form-label fw-semibold">Sizes</Label>
              <InputGroup>
                <Input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSize();
                    }
                  }}
                  placeholder="Type size and press Enter"
                />
                <Button color="primary" onClick={addSize}>
                  <FeatherIcon icon="plus" size={14} />
                </Button>
              </InputGroup>
              <div className="mt-2 d-flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <Badge
                    key={size}
                    color="info"
                    className="p-2 d-flex align-items-center gap-1"
                  >
                    {size}
                    <FeatherIcon
                      icon="x"
                      size={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => removeSize(size)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        <div className="mb-3">
          <Button
            color="success"
            onClick={generateVariants}
            disabled={colors.length === 0 || sizes.length === 0}
          >
            <FeatherIcon icon="zap" size={14} className="me-1" />
            Generate Variants
          </Button>
        </div>

        {variants.length > 0 && (
          <div className="table-responsive">
            <Table className="table-nowrap align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={`${variant.color}-${variant.size}-${index}`}>
                    <td>
                      <strong>
                        {variant.color} / {variant.size}
                      </strong>
                    </td>
                    <td>
                      <code className="text-muted">{variant.sku || generateSKU(variant.color, variant.size)}</code>
                    </td>
                    <td>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price || 0}
                        onChange={(e) =>
                          updateVariant(index, 'price', parseFloat(e.target.value) || 0)
                        }
                        style={{ width: '100px' }}
                      />
                    </td>
                    <td>
                      <Input
                        type="select"
                        value={variant.status || 'Active'}
                        onChange={(e) =>
                          updateVariant(index, 'status', e.target.value as 'Active' | 'Inactive')
                        }
                        style={{ width: '120px' }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </Input>
                    </td>
                    <td className="text-end">
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => removeVariant(index)}
                      >
                        <FeatherIcon icon="trash-2" size={14} />
                      </Button>
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
};

export default VariantBuilder;
