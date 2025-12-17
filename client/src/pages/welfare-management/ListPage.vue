<template>
  <ListLayout title="จัดการข้อมูลการเบิกสวัสดิการ">
    <template v-slot:filter>
      <q-form class="col-12 row q-col-gutter-x-md" @submit="search">
        <div class="col-12 col-md ">
          <InputGroup more-class="font-16 font-medium" for-id="requesId" is-dense v-model="filter.keyword" label="ค้นหา"
            placeholder="ค้นหาจากเลขที่ใบเบิก">
          </InputGroup>
        </div>

        <div class="col-12 col-md ">
          <InputGroup more-class="font-16 font-medium" label="วันที่ร้องขอ" compclass="col-6 q-pr-none" clearable>
            <DatePicker is-dense v-model:model="filter.dateSelected" v-model:dateShow="modelDate" for-id="date"
              :no-time="true" range-time />
          </InputGroup>
        </div>

        <div class="col-12 col-md-4 col-lg-3 q-pt-lg">
          <q-select :loading="isLoading" id="selected-status" class="q-pt-sm" outlined v-model="filter.statusName"
            :options="optionStatus" label="สถานะ" dense clearable option-value="name" emit-value map-options
            option-label="name">
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> No option </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md q-pt-lg">
          <q-select :loading="isLoading" id="selected-welfares" class="q-pt-sm" outlined v-model="filter.welfareName"
            :options="optionWelfareType" label="ประเภทสวัสดิการ" dense clearable option-value="name" emit-value
            map-options option-label="name">
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">No option</q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-md content-end q-pt-xs-md q-pt-md-none">
          <q-btn id="button-search" class="font-medium bg-blue-10 text-white font-16 q-px-sm q-pt-sm weight-8 q-mt-xs"
            dense type="submit" label="ค้นหา" icon="search" no-caps :loading="isLoading" />
        </div>
      </q-form>
    </template>

    <template v-slot:table>
      <q-table :rows-per-page-options="[5, 10, 15, 20]" flat bordered :rows="model ?? []" :columns="columns"
        row-key="index" :loading="isLoading" :wrap-cells="$q.screen.gt.lg"
        table-header-class="font-bold bg-blue-10 text-white" v-model:pagination="pagination" ref="tableRef"
        @request="onRequest" @row-click="(evt, row, index) => viewData(row.id, row.categoryName, row.welfareType)">

        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.rowIndex + 1 }}
          </q-td>
        </template>

        <template v-slot:no-data="{ icon }">
          <div class="full-width row flex-center text-negative q-gutter-sm">
            <q-icon size="2em" :name="icon" />
            <span class="font-remark font-regular ">
              ไม่พบข้อมูล
            </span>
          </div>
        </template>

        <template v-slot:body-cell-tools="props">
          <q-td :props="props" class="">
            <a @click.stop.prevent="viewData(props.row.id, props.row.categoryName, props.row.welfareType)"
              class="text-dark q-py-sm q-px-xs cursor-pointer">
              <q-icon :name="outlinedVisibility" size="xs" />
            </a>
            <a v-show="props.row.status.statusId == 2"
              @click.stop.prevent="goto(props.row.id, props.row.categoryName, props.row.welfareType)"
              class="text-dark q-py-sm q-px-xs cursor-pointer">
              <q-icon :name="outlinedEdit" size="xs" color="blue" />
            </a>
            <a v-show="props.row.status.statusId == 1" @click.stop.prevent="
              deleteData(props.row.requestId)
              " class="text-dark q-py-sm q-px-xs cursor-pointer">
              <q-icon :name="outlinedDelete" size="xs" color="red" />
            </a>
            <a v-show="props.row.status.statusId == 2" @click.stop.prevent="
              downloadData(props.row.id, props.row.categoryName, props.row.welfareType)
              " class="text-dark q-py-sm q-px-xs cursor-pointer">
              <q-icon :name="outlinedDownload" size="xs" color="blue" />
            </a>
            <a @click.stop.prevent="showEvidence(props.row.id, props.row.categoryName)"
              class="text-dark q-py-sm q-px-xs cursor-pointer" title="ดูหลักฐาน">
              <q-icon :name="outlinedAttachment" size="xs" color="green" />
            </a>
          </q-td>
        </template>

        <template v-slot:body-cell-statusName="props">
          <q-td :props="props" class="text-center">
            <q-badge class="font-regular font-14 weight-5 q-py-xs full-width"
              :color="statusColor(props.row.statusName)">
              <p class="q-py-xs q-ma-none full-width font-14" :class="textStatusColor(props.row.statusName)">
                {{ props.row.status.name }}
              </p>
            </q-badge>
          </q-td>
        </template>
      </q-table>
    </template>

  </ListLayout>

  <!-- Evidence Dialog -->
  <q-dialog v-model="evidenceDialog.show" persistent>
    <q-card style="min-width: 400px; max-width: 600px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">หลักฐานที่แนบ</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-spinner v-if="evidenceDialog.loading" color="primary" size="40px" class="q-mx-auto block" />
        
        <div v-else-if="!evidenceDialog.hasEvidence" class="text-center text-grey">
          <q-icon name="folder_open" size="50px" />
          <p>ไม่มีหลักฐานที่แนบ</p>
        </div>

        <div v-else>
          <!-- Receipt File -->
          <div v-if="evidenceDialog.fileReceipt" class="q-mb-md">
            <p class="text-weight-medium q-mb-sm">1. ใบเสร็จรับเงิน</p>
            <div class="row items-center q-gutter-sm">
              <q-chip color="blue-2" text-color="blue-9" :label="getFileName(evidenceDialog.fileReceipt)" size="sm" />
              <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewEvidence(evidenceDialog.fileReceipt)" title="ดูตัวอย่าง" />
              <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadEvidence(evidenceDialog.fileReceipt)" title="ดาวน์โหลด" />
            </div>
            <!-- Inline image preview -->
            <img v-if="evidenceDialog.fileReceiptUrl && isImageFile(evidenceDialog.fileReceipt)" 
              :src="evidenceDialog.fileReceiptUrl" 
              style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer; border: 1px solid #ddd; margin-top: 8px;"
              @click="previewEvidence(evidenceDialog.fileReceipt)"
            />
          </div>

          <!-- Medical Certificate File -->
          <div v-if="evidenceDialog.fileMedicalCertificate">
            <p class="text-weight-medium q-mb-sm">2. ใบรับรองแพทย์</p>
            <div class="row items-center q-gutter-sm">
              <q-chip color="green-2" text-color="green-9" :label="getFileName(evidenceDialog.fileMedicalCertificate)" size="sm" />
              <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewEvidence(evidenceDialog.fileMedicalCertificate)" title="ดูตัวอย่าง" />
              <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadEvidence(evidenceDialog.fileMedicalCertificate)" title="ดาวน์โหลด" />
            </div>
            <!-- Inline image preview -->
            <img v-if="evidenceDialog.fileMedicalUrl && isImageFile(evidenceDialog.fileMedicalCertificate)" 
              :src="evidenceDialog.fileMedicalUrl" 
              style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer; border: 1px solid #ddd; margin-top: 8px;"
              @click="previewEvidence(evidenceDialog.fileMedicalCertificate)"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="ปิด" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Full Preview Dialog -->
  <q-dialog v-model="previewDialog.show" maximized>
    <q-card class="bg-grey-9">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-white">{{ previewDialog.fileName }}</div>
        <q-space />
        <q-btn icon="download" flat round dense color="white" @click="downloadEvidence(previewDialog.serverFileName)" />
        <q-btn icon="close" flat round dense color="white" v-close-popup />
      </q-card-section>
      <q-card-section class="flex flex-center" style="height: calc(100vh - 80px);">
        <img 
          v-if="previewDialog.type === 'image'" 
          :src="previewDialog.url" 
          style="max-width: 100%; max-height: 100%; object-fit: contain;"
        />
        <iframe 
          v-else-if="previewDialog.type === 'pdf'" 
          :src="previewDialog.url" 
          style="width: 100%; height: 100%; border: none;"
        />
        <div v-else class="text-white text-center">
          <q-icon name="description" size="100px" />
          <p class="q-mt-md">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

</template>

<script setup>
import InputGroup from "src/components/InputGroup.vue";
import ListLayout from "src/layouts/ListLayout.vue";
import DatePicker from "src/components/DatePicker.vue";
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useListStore } from "src/stores/listStore";
import { statusColor, textStatusColor } from "src/components/status";
import { Notify } from "quasar";
import Swal from "sweetalert2";
import { formatDateThaiSlash, formatDateServer } from "src/components/format"
import exportService from "src/boot/service/exportService";

import {
  outlinedEdit,
  outlinedVisibility,
  outlinedDelete,
  outlinedDownload,
  outlinedAttachment,
} from "@quasar/extras/material-icons-outlined";
import reimbursementWelfareService from "src/boot/service/reimbursementWelfareService";
import healthCheckUpWelfareService from "src/boot/service/healthCheckUpWelfareService";

const router = useRouter();
const route = useRoute();
const listStore = useListStore();
const tableRef = ref();
const modelDate = ref(null);
const pagination = ref({ page: 1, rowsPerPage: 5 });
const isLoading = ref(false);
const fileData = ref();

const filter = ref({
  keyword: null,
  dateSelected: null,
  welfareName: null,
  statusName: null,
});

// Evidence dialog state
const evidenceDialog = ref({
  show: false,
  loading: false,
  hasEvidence: false,
  fileReceipt: null,
  fileMedicalCertificate: null,
  fileReceiptUrl: null,
  fileMedicalUrl: null,
});

// Preview dialog state
const previewDialog = ref({
  show: false,
  url: null,
  type: null,
  fileName: null,
  serverFileName: null,
});
let optionStatus = [
  { statusId: 2, name: "รอตรวจสอบ" },
  { statusId: 3, name: "อนุมัติ" },
  { statusId: 4, name: "ไม่อนุมัติ"}
];
let optionWelfareType = [
  { welfareId: 1, name: "สวัสดิการทั่วไป" },
  { welfareId: 2, name: "สวัสดิการค่าสงเคราะห์ต่าง ๆ" },
  { welfareId: 3, name: "สวัสดิการเกี่ยวกับการศึกษาของบุตร" },
  { welfareId: 4, name: "สวัสดิการค่าสงเคราะห์การเสียชีวิต" },
];

const columns = [
  { name: "index", label: "ลำดับ", align: "left", field: "index" },
  { name: "reimNumber", label: "เลขที่ใบเบิก", align: "left", field: (row) => row.reimNumber ?? "-" },
  { name: "createdBy", label: "ผู้ร้องขอ", align: "left", field: (row) => row.createdByName ?? "-" },
  { name: "sendDate", label: "วันที่ร้องขอ", align: "left", field: (row) => row.requestDate ?? "-" },
  { name: "updatedAt", label: "วันที่บันทึก/อนุมัติ", align: "left", field: (row) => row.updatedAt ?? "-" },
  { name: "welfareType", label: "ประเภท", align: "left", field: (row) => row.welfareType ?? "-" },
  {
    name: "subCategory", label: "ประเภทย่อย", align: "left", field: (row) => row.categoryName
      ? row.categoryName
      : (row.subCategoryName ? row.subCategoryName : "-")
  },
  { name: "statusName", label: "สถานะ", align: "center", field: (row) => row.status?.name ?? "-" },
  { name: "tools", label: "จัดการ", align: "left", field: "tools" },
];

const model = ref([

]);


watch(
  () => filter.value.dateSelected,
  (newValue) => {
    if (typeof newValue === "object" && newValue !== null) modelDate.value = newValue.from + " - " + newValue.to;
    else modelDate.value = newValue;
  }
);
watch(
  () => modelDate.value,
  (newValue) => {
    if (!newValue) {
      filter.value.dateSelected = newValue;
    }
  }
);
watch(
  () => route.query,
  async () => {
    await init();
  }
);

onBeforeUnmount(() => {
  isLoading.value = false;
  model.value = null;
});

onMounted(async () => {
  await init();
});


async function init() {
  const { keyword, dateSelected, statusName, welfareName } = route.query;
  if (Object.keys(route.query).length) {
    filter.value.keyword = keyword ?? null;
    filter.value.welfareName = welfareName ?? null;
    filter.value.dateSelected = dateSelected ? JSON.parse(dateSelected) : null;
    filter.value.statusName = statusName ?? null;
  }
  pagination.value.rowsPerPage = listStore.getState();
  await tableRef.value.requestServerInteraction();
}

function onRequest(props) {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  listStore.setState(rowsPerPage);
  isLoading.value = true;
  setTimeout(async () => {
    try {
      const returnedData = await fetchFromServer(
        page,
        rowsPerPage,
        filter,
        sortBy,
        descending
      );
      model.value = returnedData.map(item => ({
        reimNumber: item.reim_number,
        createdByName: item.created_by_user_name,
        requestDate: formatDateThaiSlash(item.request_date),
        updatedAt: formatDateThaiSlash(item.updated_at),
        welfareType: item.welfare_type ?? "-",
        categoryName: item.category_name,
        subCategoryName: item.sub_category_name,
        statusName: item.status,
        status: {
          name: item.status,
          statusId: item.status === "บันทึกฉบับร่าง"
            ? 1
            : item.status === "รอตรวจสอบ"
              ? 2
              : 3
        },
        id: item.id,
      }));
      pagination.value.page = page;
      pagination.value.rowsPerPage = rowsPerPage;
    } catch (error) {
      Promise.reject(error)
    }
    isLoading.value = false;
  }, 100);
}

async function fetchFromServer(page, rowPerPage, filters) {
  try {
    const allReimbursementWelfare = await reimbursementWelfareService.getReimbursementWelfare({
      keyword: filters.value.keyword ?? '',
      welfareName: filters.value.welfareName ?? '',
      statusName: filters.value.statusName ?? '',
      from: formatDateServer(filters.value.dateSelected?.from) ?? formatDateServer(filters.value.dateSelected),
      to: formatDateServer(filters.value.dateSelected?.to) ?? null,
      page: page,
      itemPerPage: rowPerPage,
    });
    pagination.value.rowsNumber = allReimbursementWelfare.data.total;
    return allReimbursementWelfare.data.docs;
  } catch (error) {
    Notify.create({
      message:
        error?.response?.data?.message ??
        "Something wrong please try again later.",
      position: "bottom-left",
      type: "negative",
    });
  }
}

function search() {
  if (!filter.value.dateSelected) filter.value.dateSelected = '';
  router.push({
    name: router.name,
    query: {
      keyword: filter.value.keyword,
      welfareName: filter.value.welfareName,
      dateSelected: filter.value.dateSelected ? JSON.stringify(filter.value.dateSelected) : null,
      statusName: filter.value.statusName,
    },
  });
}

function viewData(requestId, categoryName, welfareType) {
  if (categoryName == "สวัสดิการค่าตรวจสุขภาพประจำปี") {
    router.push({
      name: "financial_health_check_up_welfare_view",
      params: { id: requestId },
    });
  }
  else if (categoryName == "สวัสดิการกรณีเจ็บป่วย") {
    router.push({
      name: "financial_medical_welfare_view",
      params: { id: requestId },
    });
  }
  else if (categoryName == "สวัสดิการค่าทำฟันเพื่อการรักษา ยกเว้นทันตกรรมเพื่อความสวยงาม") {
    router.push({
      name: "financial_dental_welfare_view",
      params: { id: requestId },
    });
  }
  else if (welfareType == "สวัสดิการค่าสงเคราะห์ต่าง ๆ") {
    if (categoryName == "สวัสดิการเสียชีวิตคนในครอบครัว") {
      router.push({
        name: "financial_family_funeral_welfare_view",
        params: { id: requestId },
      });
    }
    else {
      router.push({
        name: "financial_various_welfare_view",
        params: { id: requestId },
      });
    }
  }
  else if (welfareType == "สวัสดิการค่าสงเคราะห์การเสียชีวิต") {
    router.push({
      name: "financial_funeral_welfare_view",
      params: { id: requestId },
    });
  }
  else if (welfareType == "สวัสดิการเกี่ยวกับการศึกษาของบุตร") {
    router.push({
      name: "financial_children_welfare_view",
      params: { id: requestId },
    });
  }
}

function goto(requestId, categoryName, welfareType) {
  if (categoryName == "สวัสดิการค่าตรวจสุขภาพประจำปี") {
    router.push({
      name: "financial_health_check_up_welfare_edit",
      params: { id: requestId },
    });
  }
  else if (categoryName == "สวัสดิการกรณีเจ็บป่วย") {
    router.push({
      name: "financial_medical_welfare_edit",
      params: { id: requestId },
    });
  }
  else if (categoryName == "สวัสดิการค่าทำฟันเพื่อการรักษา ยกเว้นทันตกรรมเพื่อความสวยงาม") {
    router.push({
      name: "financial_dental_welfare_edit",
      params: { id: requestId },
    });
  }
  else if (welfareType == "สวัสดิการค่าสงเคราะห์ต่าง ๆ") {
    if (categoryName == "สวัสดิการเสียชีวิตคนในครอบครัว") {
      router.push({
        name: "financial_family_funeral_welfare_edit",
        params: { id: requestId },
      });
    }
    else {
      router.push({
        name: "financial_various_welfare_edit",
        params: { id: requestId },
      });
    }
  }
  else if (welfareType == "สวัสดิการค่าสงเคราะห์การเสียชีวิต") {
    router.push({
      name: "financial_funeral_welfare_edit",
      params: { id: requestId },
    });
  }
  else if (welfareType == "สวัสดิการเกี่ยวกับการศึกษาของบุตร") {
    router.push({
      name: "financial_children_welfare_edit",
      params: { id: requestId },
    });
  }
}

async function deleteData(id) {
  Swal.fire({
    title: "Do you want to save the changes??",
    html: `You won't be able to revert this!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
    showLoaderOnConfirm: true,
    reverseButtons: true,
    customClass: {
      confirmButton: "save-button",
      cancelButton: "cancel-button",
    },
    preConfirm: async () => {
      try {
        // await GspcRequestService.delete(id);
      } catch (error) {
        Swal.showValidationMessage(`Delete Request Failed.`);
        Notify.create({
          message:
            error?.response?.data?.message ??
            "Delete Request Failed, Something wrong please try again later.",
          position: "bottom-left",
          type: "negative",
        });
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        html: `Request code <b>${id}</b> deleted.`,
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          confirmButton: "save-button",
        },
      }).then(() => {
        location.reload();
      });
    }
  });
}

async function downloadData(requestId, categoryName, welfareType) {
  const notify = Notify.create({
    message: "กรุณารอสักครู่ ระบบกำลังทำการดาวน์โหลด",
    position: "top-right",
    spinner: true,
    type: 'info',
  });
  try {
    if (categoryName == "สวัสดิการค่าตรวจสุขภาพประจำปี") {
      fileData.value = await exportService.healthCheckup(requestId);
    }
    else if (categoryName == "สวัสดิการกรณีเจ็บป่วย") {
      fileData.value = await exportService.medical(requestId);
    }
    else if (categoryName == "สวัสดิการค่าทำฟันเพื่อการรักษา ยกเว้นทันตกรรมเพื่อความสวยงาม") {
      fileData.value = await exportService.dental(requestId);
    }
    else if (welfareType == "สวัสดิการค่าสงเคราะห์ต่าง ๆ") {
      if (categoryName == "สวัสดิการเสียชีวิตคนในครอบครัว") {
        fileData.value = await exportService.variousFuneralFamily(requestId);
      }
      else {
        fileData.value = await exportService.various(requestId);
      }
    }
    else if (welfareType == "สวัสดิการค่าสงเคราะห์การเสียชีวิต") {
      fileData.value = await exportService.funeralDeceaseEmployee(requestId);
    }
    else if (welfareType == "สวัสดิการเกี่ยวกับการศึกษาของบุตร") {
      fileData.value = await exportService.childrenEnducation(requestId);
    }
    const result = fileData.value;
    let filename = null;
    const contentDisposition = result.headers["content-disposition"];
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="?([^"]+)"?/);
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1]);
      }
    }

    const blob = new Blob([result.data], { type: "application/pdf" });

    const a = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  catch (error) {
    Notify.create({
      message:
        error?.response?.data?.message ??
        "ดาวน์โหลดไม่สำเร็จกรุณาลองอีกครั้ง",
      position: "top-right",
      type: "primary",
    });
  }
  finally {
    notify();
  }
}

// Evidence functions
function getFileName(filename) {
  if (!filename) return '';
  return filename.replace(/^\d+-/, '');
}

function getFileType(filename) {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'unknown';
}

function isImageFile(filename) {
  return getFileType(filename) === 'image';
}

async function showEvidence(requestId, categoryName) {
  evidenceDialog.value = {
    show: true,
    loading: true,
    hasEvidence: false,
    fileReceipt: null,
    fileMedicalCertificate: null,
    fileReceiptUrl: null,
    fileMedicalUrl: null,
  };

  try {
    // Currently only health check up welfare has evidence files
    if (categoryName == "สวัสดิการค่าตรวจสุขภาพประจำปี") {
      const result = await healthCheckUpWelfareService.getWelfareById(requestId);
      const data = result.data.datas;
      
      evidenceDialog.value.fileReceipt = data?.fileReceipt || null;
      evidenceDialog.value.fileMedicalCertificate = data?.fileMedicalCertificate || null;
      evidenceDialog.value.hasEvidence = !!(data?.fileReceipt || data?.fileMedicalCertificate);

      // Load image previews
      if (data?.fileReceipt && isImageFile(data.fileReceipt)) {
        loadEvidencePreview(data.fileReceipt, 'receipt');
      }
      if (data?.fileMedicalCertificate && isImageFile(data.fileMedicalCertificate)) {
        loadEvidencePreview(data.fileMedicalCertificate, 'medical');
      }
    } else {
      // Other welfare types don't have evidence files yet
      evidenceDialog.value.hasEvidence = false;
    }
  } catch (error) {
    Notify.create({
      message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการโหลดข้อมูล',
      position: 'bottom-left',
      type: 'negative',
    });
  } finally {
    evidenceDialog.value.loading = false;
  }
}

async function loadEvidencePreview(filename, type) {
  try {
    const result = await healthCheckUpWelfareService.getFileByName(filename);
    const ext = filename.split('.').pop().toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    
    const blob = new Blob([result.data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    if (type === 'receipt') {
      evidenceDialog.value.fileReceiptUrl = url;
    } else {
      evidenceDialog.value.fileMedicalUrl = url;
    }
  } catch (error) {
    console.error('Error loading preview:', error);
  }
}

async function previewEvidence(filename) {
  if (!filename) return;
  
  const notify = Notify.create({
    message: 'กำลังโหลดไฟล์...',
    position: 'top-right',
    spinner: true,
    type: 'info',
  });
  
  try {
    const result = await healthCheckUpWelfareService.getFileByName(filename);
    const fileType = getFileType(filename);
    
    let mimeType = 'application/octet-stream';
    if (fileType === 'image') {
      const ext = filename.split('.').pop().toLowerCase();
      if (ext === 'png') mimeType = 'image/png';
      else mimeType = 'image/jpeg';
    } else if (fileType === 'pdf') {
      mimeType = 'application/pdf';
    }
    
    const blob = new Blob([result.data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    previewDialog.value = {
      show: true,
      url: url,
      type: fileType,
      fileName: getFileName(filename),
      serverFileName: filename,
    };
  } catch (error) {
    Notify.create({
      message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการโหลดไฟล์',
      position: 'top-right',
      type: 'negative',
    });
  } finally {
    notify();
  }
}

async function downloadEvidence(filename) {
  if (!filename) return;
  
  const notify = Notify.create({
    message: 'กำลังดาวน์โหลด...',
    position: 'top-right',
    spinner: true,
    type: 'info',
  });
  
  try {
    const result = await healthCheckUpWelfareService.getFileByName(filename);
    
    const ext = filename.split('.').pop().toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';
    
    const blob = new Blob([result.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(filename);
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    Notify.create({
      message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการดาวน์โหลด',
      position: 'top-right',
      type: 'negative',
    });
  } finally {
    notify();
  }
}
</script>
