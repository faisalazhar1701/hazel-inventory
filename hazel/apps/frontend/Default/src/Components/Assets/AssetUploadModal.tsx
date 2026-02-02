import React, { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
} from 'reactstrap';
import { assetsAPI } from '../../api/assets';
import { toast } from 'react-toastify';
import FeatherIcon from 'feather-icons-react';

interface AssetUploadModalProps {
  isOpen: boolean;
  toggle: () => void;
  entityType: string;
  entityId: string;
  onUploadSuccess: () => void;
}

const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  isOpen,
  toggle,
  entityType,
  entityId,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('IMAGE');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      await assetsAPI.uploadAsset({
        file,
        category,
        entityType,
        entityId,
      });
      toast.success('Asset uploaded successfully');
      setFile(null);
      setCategory('IMAGE');
      onUploadSuccess();
      toggle();
    } catch (error) {
      console.error('Failed to upload asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload asset');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCategory('IMAGE');
    toggle();
  };

  return (
    <Modal isOpen={isOpen} toggle={handleClose} centered>
      <ModalHeader toggle={handleClose}>
        <h5 className="modal-title">Upload Asset</h5>
      </ModalHeader>
      <ModalBody>
        <div className="mb-3">
          <Label className="form-label">File</Label>
          <Input
            type="file"
            onChange={handleFileChange}
            accept="*/*"
            disabled={uploading}
          />
          {file && (
            <div className="mt-2">
              <small className="text-muted">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </small>
            </div>
          )}
        </div>

        <div className="mb-3">
          <Label className="form-label">Category</Label>
          <Input
            type="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={uploading}
          >
            <option value="IMAGE">Image</option>
            <option value="TECH_PACK">Tech Pack</option>
            <option value="CERTIFICATE">Certificate</option>
            <option value="OTHER">Other</option>
          </Input>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={handleSubmit}
          disabled={!file || uploading}
        >
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Uploading...
            </>
          ) : (
            <>
              <FeatherIcon icon="upload" className="me-1" size={16} />
              Upload
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AssetUploadModal;
