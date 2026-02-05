import React, { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Row,
  Form,
  Input,
  Label,
  Button,
  FormFeedback,
} from 'reactstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import BreadCrumb from '../../Components/Common/BreadCrumb';

const ProfileSettings: React.FC = () => {
  document.title = 'Profile Settings | Hazel Inventory';

  const [usernameSaved, setUsernameSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const usernameForm = useFormik({
    initialValues: {
      username:
        typeof sessionStorage !== 'undefined'
          ? sessionStorage.getItem('profileUsername') || 'Admin'
          : 'Admin',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Username is required').min(2, 'At least 2 characters'),
    }),
    onSubmit: (values) => {
      // In a real app: call API to update username; for now persist to sessionStorage
      sessionStorage.setItem('profileUsername', values.username);
      setUsernameSaved(true);
      setTimeout(() => setUsernameSaved(false), 2000);
    },
  });

  const passwordForm = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .required('New password is required')
        .min(6, 'At least 6 characters')
        .notOneOf([Yup.ref('currentPassword')], 'New password must differ from current'),
      confirmPassword: Yup.string()
        .required('Confirm password is required')
        .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
    }),
    onSubmit: () => {
      // In a real app: call API to change password
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
      passwordForm.resetForm();
    },
  });

  React.useEffect(() => {
    const saved = sessionStorage.getItem('profileUsername');
    if (saved) usernameForm.setFieldValue('username', saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page-content">
      <Container fluid>
        <BreadCrumb title="Profile Settings" pageTitle="Settings" />
        <Row>
          <Col lg={6}>
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Username</h5>
              </CardHeader>
              <CardBody>
                <Form onSubmit={usernameForm.handleSubmit}>
                  <div className="mb-3">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      type="text"
                      id="username"
                      name="username"
                      value={usernameForm.values.username}
                      onChange={usernameForm.handleChange}
                      onBlur={usernameForm.handleBlur}
                      invalid={usernameForm.touched.username && !!usernameForm.errors.username}
                    />
                    {usernameForm.touched.username && usernameForm.errors.username && (
                      <FormFeedback type="invalid">{usernameForm.errors.username}</FormFeedback>
                    )}
                  </div>
                  <Button type="submit" color="primary" disabled={usernameForm.isSubmitting}>
                    {usernameSaved ? 'Saved' : 'Save Username'}
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Col>
          <Col lg={6}>
            <Card>
              <CardHeader>
                <h5 className="card-title mb-0">Change Password</h5>
              </CardHeader>
              <CardBody>
                <Form onSubmit={passwordForm.handleSubmit}>
                  <div className="mb-3">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.values.currentPassword}
                      onChange={passwordForm.handleChange}
                      onBlur={passwordForm.handleBlur}
                      invalid={
                        passwordForm.touched.currentPassword &&
                        !!passwordForm.errors.currentPassword
                      }
                    />
                    {passwordForm.touched.currentPassword &&
                      passwordForm.errors.currentPassword && (
                        <FormFeedback type="invalid">
                          {passwordForm.errors.currentPassword}
                        </FormFeedback>
                      )}
                  </div>
                  <div className="mb-3">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.values.newPassword}
                      onChange={passwordForm.handleChange}
                      onBlur={passwordForm.handleBlur}
                      invalid={
                        passwordForm.touched.newPassword && !!passwordForm.errors.newPassword
                      }
                    />
                    {passwordForm.touched.newPassword && passwordForm.errors.newPassword && (
                      <FormFeedback type="invalid">
                        {passwordForm.errors.newPassword}
                      </FormFeedback>
                    )}
                  </div>
                  <div className="mb-3">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.values.confirmPassword}
                      onChange={passwordForm.handleChange}
                      onBlur={passwordForm.handleBlur}
                      invalid={
                        passwordForm.touched.confirmPassword &&
                        !!passwordForm.errors.confirmPassword
                      }
                    />
                    {passwordForm.touched.confirmPassword &&
                      passwordForm.errors.confirmPassword && (
                        <FormFeedback type="invalid">
                          {passwordForm.errors.confirmPassword}
                        </FormFeedback>
                      )}
                  </div>
                  <Button type="submit" color="primary" disabled={passwordForm.isSubmitting}>
                    {passwordSaved ? 'Saved' : 'Change Password'}
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProfileSettings;
