import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { attachment } from "../../../axios/custom";
import { Spinner } from "react-activity";
import { AppSettings } from "../../../config/app-settings";
import samplefile from "./samplefile/Sample_bill_format.docx";

import "react-activity/dist/library.css";
import { ToastContainer, toast } from "react-toastify";
import FilterComponent from "../../../components/filtercomponent/filtercomponent";
import DataTable from "react-data-table-component";

const BillFormats = () => {
  const token = sessionStorage.getItem("myToken");
  const organisationId = sessionStorage.getItem("organisationId");
  const billData = {
    ContentOne: "",
    ContentTwo: "",
    ClosingSection: "",
  };
  const [billFormatData, setBillFormatData] = useState(billData);
  const appSettings = useContext(AppSettings);
  const userData = appSettings.userData;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [signatureOne, setSignatureOne] = useState(null);
  const [signatureTwo, setSignatureTwo] = useState(null);
  const [signatureOneName, setSignatureOneName] = useState("");
  const [signatureTwoName, setSignatureTwoName] = useState("");
  const [billFormats, setBillFormats] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [itemId, setItemId] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  useEffect(() => {
    const fetchAllBillFormats = async () => {
      try{
        const response = await api.get(`/billing/${organisationId}/bill-format`);
        setBillFormats(response.data);
        console.log("Bills:", response.data);
      } catch(error){
        console.error("Error fetching bill formats:", error);
      }
    } 

    fetchAllBillFormats();
  }, [organisationId]);

    
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditRow((prevEditData) => ({
      ...prevEditData,
      [name]: value,
    }));
  };

  const handleEdit = (item) => {
    const signatureOne = `data:image/png;base64,${item.signatureOneData}`;
    const signatureOneName = `data:image/png;base64,${item.signatureOneName}`;
    setSignatureOne(signatureOne);
    setSignatureOneName(signatureOneName);

    const signatureTwo = `data:image/png;base64,${item.signatureTwoData}`;
    const signatureTwoName = `data:image/png;base64,${item.signaturTwoName}`;
    setSignatureTwo(signatureTwo);
    setSignatureTwoName(signatureTwoName);

    setEditRow(item);
    setItemId(item?.billFormatId);
  };

  const columns = [
    {
      name: "S/N",
      selector: (row, index) => index + 1,
      sortable: true,
      grow: 0,
      style: {
        textAlign: "center",
      },
    },
    {
      name: "Content One",
      selector: (row) => row.contentOne,
      sortable: true,
      grow: 2,
      style: {
        textAlign: "center",
      },
    },
    {
      name: "Content Two",
      selector: (row) => row.contentTwo,
      sortable: true,
      grow: 2,
      style: {
        textAlign: "center",
      },
    },
    {
      name: "Closing Section",
      selector: (row) => row.closingSection,
      sortable: true,
      grow: 2,
      style: {
        textAlign: "center",
      },
    },
    {
      name: "Action",
      sortable: false,
      center: true,
      grow: 0,
      cell: (row) => (
        <button
          data-bs-toggle="modal"
          data-bs-target="#editBillFormat"
          className="btn text-dark"
          type="button"
          onClick={() => handleEdit(row)}
        >
          <i className="fa-solid fa-pen-to-square"></i> Edit
        </button>
      ),
    },
  ];

  const filteredItems = billFormats?.filter(
    (item) =>
      item.contentOne &&
      item.contentTwo &&
      item.closingSection &&
      item.contentOne.toLowerCase().includes(filterText.toLowerCase()) &&
      item.contentTwo.toLowerCase().includes(filterText.toLowerCase()) &&
      item.closingSection.toLowerCase().includes(filterText.toLowerCase()) 
  );

  const subHeaderComponentMemo = useMemo(() => {
    const handleClear = () => {
      if (filterText) {
        setResetPaginationToggle(!resetPaginationToggle);
        setFilterText("");
      } 
    };

    return (
      <FilterComponent
        onFilter={(e) => setFilterText(e.target.value)}
        onClear={handleClear}
        filterText={filterText}
        placeholder="Search For Bill"
      />
    );
  }, [filterText, resetPaginationToggle]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPending(false);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  const handleSignatureOne = (event) => {
    const file = event.target.files[0];
    setSignatureOne(file);

    // const reader = new FileReader();
    // reader.onload = () => {
    //   setSignatureOne(reader.result)
    // };

    // if (file) {
    //   reader.readAsDataURL(file);
    // }
    setSignatureOneName(file.name);
  };

  const handleSignatureTwo = (event) => {
    const file = event.target.files[0];
    setSignatureTwo(file);
    // const reader = new FileReader();
    // reader.onload = () => {
    //   setSignatureTwo(reader.result)
    // };

    // if (file) {
    //   reader.readAsDataURL(file);
    // }
    // setSignatureTwoName(file.name);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillFormatData({ ...billFormatData, [name]: value });
  };

  const addBillFormat = async (e) => {
    setLoading(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append("SignatureOne", signatureOne);
    formData.append("SignatureTwo", signatureTwo);
    formData.append("ContentOne", billFormatData.ContentOne);
    formData.append("ContentTwo", billFormatData.ContentTwo);
    formData.append("ClosingSection", billFormatData.ClosingSection);
    formData.append("dateCreated", new Date().toISOString());
    formData.append("createdBy", userData[0]?.email);

 

    await attachment
      .post(`billing/${organisationId}/create-bill-format`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {

        if (response.status === 200) {
          setLoading(false);
          toast.success(response.data.statusMessage, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
        }
        setLoading(false);
        return true;
      })
      .catch((error) => {
        setLoading(false);
  
        toast.error(error.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      });
  };

  const editBillFormat = async (e) => {
    setLoading(true);
    e.preventDefault();
    const formData = new FormData();
    formData.append("SignatureOne", signatureOne);
    formData.append("SignatureTwo", signatureTwo);
    formData.append("ContentOne", editRow.contentOne);
    formData.append("ContentTwo", editRow.contentTwo);
    formData.append("ClosingSection", editRow.closingSection);
    formData.append("dateCreated", new Date().toISOString());
    formData.append("createdBy", userData[0]?.email);

 
    await attachment
      .post(`billing/${organisationId}/bill-format/${itemId}/update-bill-format`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {

        if (response.status === 200) {
          setLoading(false);
          toast.success(response.data.statusMessage, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
        }
        setLoading(false);
        return true;
      })
      .catch((error) => {
        setLoading(false);
  
        toast.error(error.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      });
  };

    useEffect(() => {
      api
        .get(`billing/${organisationId}/bill-format/1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
  
          setData(response.data);
        })
        .catch((error) => {
           toast.error(error.message, {
             position: "top-right",
             autoClose: 5000,
             hideProgressBar: true,
             closeOnClick: true,
             pauseOnHover: true,
             draggable: true,
             progress: undefined,
             theme: "colored",
           });
        });
    }, []);

  return (
    <>
      <div>
        <ol className="breadcrumb float-xl-end">
          <li className="breadcrumb-item">
            <Link to="/dashboard">Home</Link>
          </li>
          <li className="breadcrumb-item">Administration</li>
          <li className="breadcrumb-item active">Bill Format </li>
        </ol>
        <h1 className="page-header mb-3">Bill Formats</h1>
        <hr />

        <div className="row">
          <div className="col">
            <div className="mt-2">
              <h4>Click here to download the Sample Template</h4>
              <a href={samplefile} className="">
                Download the sample template
              </a>
            </div>
          </div>
          <div className="col w-full p-3">
            <div className="flex justify-end mb-3">
              <button
                data-bs-toggle="modal"
                data-bs-target="#addBillFormat"
                className="btn shadow-md bg-blue-900 text-white"
                type="button"
              >
                Add Bill Format
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
          <div className="w-full p-3">
            <div className="">
              <div className="">
                <DataTable
                  columns={columns}
                  data={filteredItems}
                  onClick={(item) => console.log(item)}
                  pagination
                  progressPending={pending}
                  paginationResetDefaultPage={resetPaginationToggle}
                  subHeader
                  subHeaderComponent={subHeaderComponentMemo}
                />
              </div>
            </div>
          </div>
        </div>

      <div className="modal fade" id="addBillFormat">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Create Bill Format</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-hidden="true"
              ></button>
            </div>
            <div className="modal-body">
              <ToastContainer />
              <div className="  ">
                <div className=" p-2 ">
                  <form onSubmit={addBillFormat}>
                    <div className="row gx-3">
                      <div className="col-6">
                        <label
                          className="form-label"
                          htmlFor="exampleInputEmail1"
                        >
                          Signature One
                        </label>
                        <div className="">
                          <input
                            type="file"
                            id="file"
                            accept="image/*"
                            onChange={handleSignatureOne}
                          />
                        </div>
                      </div>

                      <div className="col-6">
                        <label
                          className="form-label"
                          htmlFor="exampleInputEmail1"
                        >
                          Signature Two
                        </label>
                        <div className="">
                          <input
                            type="file"
                            id="file"
                            accept="image/*"
                            onChange={handleSignatureTwo}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row gx-3 mt-3">
                      <div className="col-12">
                        <div className="mb-3 ">
                          <label
                            className="form-label"
                            htmlFor="exampleInputEmail1"
                          >
                            Content One
                          </label>

                          <input
                            type="text"
                            className="form-control"
                            name="ContentOne"
                            value={billFormatData.ContentOne}
                            placeholder="Enter Content One"
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row gx-3 mt-1">
                      <div className="col-12">
                        <div className="mb-3 ">
                          <label
                            className="form-label"
                            htmlFor="exampleInputEmail1"
                          >
                            Content Two
                          </label>

                          <input
                            type="text"
                            className="form-control"
                            name="ContentTwo"
                            value={billFormatData.ContentTwo}
                            placeholder="Enter Content Two"
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row gx-3 mt-1">
                      <div className="col-12">
                        <div className="mb-3 ">
                          <label
                            className="form-label"
                            htmlFor="exampleInputEmail1"
                          >
                            Closing Section
                          </label>

                          <input
                            type="text"
                            className="form-control"
                            name="ClosingSection"
                            value={billFormatData.ClosingSection}
                            placeholder="Enter Closing Section"
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn shadow-md bg-blue-900 text-white"
                      >
                        {loading ? <Spinner /> : "Add"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="editBillFormat">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Bill Format</h4>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-hidden="true"
              ></button>
            </div>
            <div className="modal-body">
              <ToastContainer />
              <div className="  ">
                <div className=" p-2 ">
                  <form onSubmit={editBillFormat}>
                    <div className="row gx-3">
                      <div className="col-6">
                        <label
                          className="form-label"
                          htmlFor="exampleInputEmail1"
                        >
                          Signature One
                        </label>
                        <div className="">
                          <input
                            type="file"
                            id="file"
                            accept="image/*"
                            onChange={handleSignatureOne}
                          />
                        </div>
                      </div>

                      <div className="col-6">
                        <label
                          className="form-label"
                          htmlFor="exampleInputEmail1"
                        >
                          Signature Two
                        </label>
                        <div className="">
                          <input
                            type="file"
                            id="file"
                            accept="image/*"
                            onChange={handleSignatureTwo}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row gx-3 mt-3">
                      <div className="col-12">
                        <div className="mb-3 ">
                          <label
                            className="form-label"
                            htmlFor="exampleInputEmail1"
                          >
                            Content One
                          </label>

                          <input
                            type="text"
                            className="form-control"
                            name="contentOne"
                            value={editRow ? editRow.contentOne : ""}
                            placeholder="Enter Content One"
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row gx-3 mt-1">
                      <div className="col-12">
                        <div className="mb-3 ">
                          <label
                            className="form-label"
                            htmlFor="exampleInputEmail1"
                          >
                            Content Two
                          </label>

                          <input
                            type="text"
                            className="form-control"
                            name="contentTwo"
                            value={editRow ? editRow.contentTwo : ""}
                            placeholder="Enter Content Two"
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row gx-3 mt-1">
                      <div className="col-12">
                        <div className="mb-3 ">
                          <label
                            className="form-label"
                            htmlFor="exampleInputEmail1"
                          >
                            Closing Section
                          </label>

                          <input
                            type="text"
                            className="form-control"
                            name="closingSection"
                            value={editRow ? editRow.closingSection : ""}
                            placeholder="Enter Closing Section"
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn shadow-md bg-blue-900 text-white"
                      >
                        {loading ? <Spinner /> : "Edit"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        style={{ marginTop: "20px" }}
        className="btn shadow-md bg-blue-900 text-white"
        type="button"
        onClick={() => window.history.back()}
      >
        Back
      </button>
    </>
  );
};

export default BillFormats;



