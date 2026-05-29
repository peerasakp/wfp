<template>
  <q-page padding class="q-pt-none q-mb-lg">
    <DynamicBreadcrumb />
    <div class="row q-pb-md">
      <div class="col-lg-8 col-12">
        <p class="q-mb-none col-8 q-mb-md font-medium">สิทธิ์คงเหลือ</p>
        <!-- card แถวที่ 1 -->
        <div class="row q-pb-md q-col-gutter-md q-pr-md">
          <template v-if="isLoading">
            <div v-for="index in 4" :key="index" class="col-12 col-lg-6">
              <q-skeleton height="150px" />
            </div>
          </template>
          <div v-else class="col-12 col-lg-6" v-for="(items) in remainingAll" :key="items.categoryName">
            <q-card class="border-card bg-blue-9 q-ms-md">
              <q-card-section class="q-px-lg row items-center justify-between">
                <!-- ข้อความ -->
                <div class="col">
                  <p class="q-mb-none text-white font-20 font-bold q-pb-md ellipsis">{{ items.categoryName }}</p>
                  <p class="q-mb-none text-white font-16 q-pb-sm">

                    {{ items?.perUsersRemaining !== null && items?.perUsersRemaining !== undefined ?
                      (items?.perUsersRemaining > 0 ? "เงินคงเหลือ " +
                        items?.fundRemaining + " บาท" :
                        (items?.perUsersRemaining === 0 ? "ไม่จำกัดจำนวนเงิน" : "ใช้สิทธิ์ครบแล้ว"))
                      : (items?.fundRemaining ? "เงินคงเหลือ " +
                        items?.fundRemaining + " บาทต่อปี" :
                        (items?.perTimesRemaining ?
                    items?.perTimesRemaining + " บาทต่อครั้ง" :
                    "ไม่จำกัดจำนวนเงิน"))
                    }}
                  </p>
                  <p class="q-mb-none text-white font-16">
  {{
    items?.perUsersRemaining !== undefined && items?.perUsersRemaining !== null
    ? "จำนวน " + items?.perUsersRemaining + " ครั้ง"
    : (items?.requestsRemaining ? "จำนวน " + items?.requestsRemaining + " ครั้ง" : 'ไม่จำกัดครั้ง')
  }}
</p>

                </div>
                <!-- รูปภาพ -->
                <q-img :src="items?.src" class="q-mt-xl" fit="fill" :ratio="16 / 9" width="4rem" height="4rem">
                  <template v-slot:error>
                    <div class="absolute-full flex flex-center bg-negative text-white">
                      ไม่พบรูป
                    </div>
                  </template>
                </q-img>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- ส่วนที่ 2: card ที่มีปุ่มดาวน์โหลด -->
      <div class="col-lg-4 col-12 q-gutter-y-sm ">
        <div class="row q-mb-md items-center justify-between " :class="{ 'q-mt-md': $q.screen.lt.md }">
          <p class="q-mb-none col font-medium">ระเบียบการเบิกสวัสดิการ</p>
          <!-- แสดงปุ่มแก้ไขเมื่อไม่อยู่ในโหมดแก้ไข -->
          <q-btn v-if="!isEditing && authStore.isEditor" color="orange-4" text-color="white" label="แก้ไข"
            class="font-14 border-button-edit" @click="toggleEdit" :loading="isLoadingFile" />
          <!-- แสดงปุ่มอัปโหลดและบันทึกเมื่ออยู่ในโหมดแก้ไข -->
          <div v-else-if="isEditing && authStore.isEditor" class="row q-gutter-sm">
            <q-btn color="blue-10" text-color="white" label="อัปโหลด" @click="triggerFileUpload"
              class="font-14 border-button-edit" />
            <input type="file" ref="fileInput" multiple style="display: none" @change="handleFileChange" />
            <q-btn color="green-6" text-color="white" label="บันทึก" class="font-14 border-button-edit"
              @click="saveFileChanged" :loading="isLoadingFile" />
          </div>
        </div>
        <q-scroll-area style="height: 300px;" class="bg-grey-11">
          <div v-if="Array.isArray(file) && file.length > 0">
            <div class="col-4 col-md" v-for="(items, index) in file" :key="index">
              <q-card class="bg-grey-11 no-shadow no-border-radius">
                <q-card-section class="q-px-lg row items-center justify-between">
                  <div class="row">
                    <!-- รูปภาพ -->
                    <img src="../../assets/document.svg" alt="document-image" class="q-mr-md" />
                    <!-- ข้อความ -->
                    <div class="regulation-name">
                      <p class="q-mb-none font-14 q-px-md text-ellipsis ellipsis">{{ items.replace(/^\d+-/, "") ?? "-"
                      }}</p>
                    </div>
                  </div>
                  <q-btn v-if="!isEditing" :href="fileFetch.url[index]" :download="items" color="blue-10"
                    text-color="white" label="ดาวน์โหลด"
                    class="font-14 border-button q-px-sm q-mt-xs-sm q-mt-md-none" />
                  <q-icon v-else-if="isEditing && authStore.isEditor" name="remove_circle" color="red"
                    @click="removeFile(items, index)" class="cursor-pointer btn-delete-file" />
                </q-card-section>
              </q-card>
            </div>
          </div>
          <div v-else class="absolute-center">
            <p class="text-center text-red text-bold font-20">ไม่พบข้อมูลระเบียบ</p>
          </div>
        </q-scroll-area>
        <q-separator />
      </div>
    </div>
    <q-table v-if="authStore.isEditor" :rows-per-page-options="[5, 10, 15, 20]" flat bordered :rows="model ?? []"
      :columns="columns" row-key="index" :loading="isLoading" :wrap-cells="$q.screen.gt.lg"
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
          <a v-show="props.row.status.statusId == 2" @click.stop.prevent="
            downloadData(props.row.id, props.row.categoryName, props.row.welfareType)
            " class="text-dark q-py-sm q-px-xs cursor-pointer">
            <q-icon :name="outlinedDownload" size="xs" color="blue" />
          </a>
        </q-td>
      </template>

      <template v-slot:body-cell-statusName="props">
        <q-td :props="props" class="text-center">
          <q-badge class="font-regular font-14 weight-5 q-py-xs full-width" :color="statusColor(props.row.statusName)">
            <p class="q-py-xs q-ma-none full-width font-14" :class="textStatusColor(props.row.statusName)">
              {{ props.row.status.name }}
            </p>
          </q-badge>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import DynamicBreadcrumb from "components/DynamicBreadcrumb.vue";
import { statusColor, textStatusColor } from "src/components/status";
import { ref, onMounted } from "vue";
import { useListStore } from "src/stores/listStore";
import { formatDateThaiSlash, formatNumber, formatDateServer } from "src/components/format";
import { Notify } from "quasar";
import { useAuthStore } from "src/stores/authStore";
import healthCheckUpWelfareService from "src/boot/service/healthCheckUpWelfareService";
import dentalWelfareService from "src/boot/service/dentalWelfareService";
import medicalWelfareService from "src/boot/service/medicalWelfareService";
import variousWelfareService from "src/boot/service/variousWelfareService";
import {
  outlinedEdit,
  outlinedVisibility,
  outlinedDownload,
} from "@quasar/extras/material-icons-outlined";
import reimbursementWelfareService from "src/boot/service/reimbursementWelfareService";
import { useRouter } from "vue-router";
import exportService from "src/boot/service/exportService";
import HealthCheckImage from "../../assets/health-check.svg";
import dentalImage from "../../assets/dentalwork.svg";
import medicalImage from "../../assets/medical.svg";
import marriageImage from "../../assets/marriage.svg";

import HomeService from "src/boot/service/homeService";
import Swal from "sweetalert2";

const fileData = ref();
const router = useRouter();
const tableRef = ref();
const listStore = useListStore();
const isLoading = ref(false);
const isLoadingFile = ref(false);
const isEditing = ref(false);

const file = ref([]);
const fileInput = ref(null);
const fileUpload = ref([]);
const fileDelete = ref([]);
const fileFetch = ref([]);

const authStore = useAuthStore();
const filter = ref({
  keyword: null,
  dateSelected: null,
  welfareName: null,
  statusName: null,
});

function toggleEdit() {
  isEditing.value = !isEditing.value;
}
onMounted(async () => {
  await init();
});

const remainingAll = ref([]);

async function fetchRemainingHealthCheckup() {
  try {
    let remaining = {};
    const fetchRemaining = await healthCheckUpWelfareService.getRemaining();
    if (fetchRemaining.data?.datas?.requestsRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.requestsRemaining))) {
      remaining.requestsRemaining = formatNumber(fetchRemaining.data?.datas?.requestsRemaining);
    }
    if (fetchRemaining.data?.datas?.fundRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.fundRemaining))) {
      remaining.fundRemaining = formatNumber(fetchRemaining.data?.datas?.fundRemaining);
    }
    if (fetchRemaining.data?.datas?.perTimesRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.perTimesRemaining))) {
      remaining.perTimesRemaining = formatNumber(fetchRemaining.data?.datas?.perTimesRemaining);
    }
    if (fetchRemaining.data?.datas?.categoryName != null) {
      remaining.categoryName = fetchRemaining.data?.datas?.categoryName;
    }
    remaining.src = HealthCheckImage;
    remainingAll.value.push(remaining);
  }
  catch (error) {
    Promise.reject(error);
  }
}


async function fetchRemainingDental() {
  try {
    let remaining = {};
    const fetchRemaining = await dentalWelfareService.getRemaining({ createFor: model.value.createFor });
    if (fetchRemaining.data?.datas?.requestsRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.requestsRemaining))) {
      remaining.requestsRemaining = formatNumber(fetchRemaining.data?.datas?.requestsRemaining);
    }
    if (fetchRemaining.data?.datas?.fundRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.fundRemaining))) {
      remaining.fundRemaining = formatNumber(fetchRemaining.data?.datas?.fundRemaining);
    }
    if (fetchRemaining.data?.datas?.perTimesRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.perTimesRemaining))) {
      remaining.perTimesRemaining = formatNumber(fetchRemaining.data?.datas?.perTimesRemaining);
    }
    if (fetchRemaining.data?.datas?.categoryName != null) {
      remaining.categoryName = fetchRemaining.data?.datas?.categoryName;
    }
    remaining.src = dentalImage;
    remainingAll.value.push(remaining);
  }
  catch (error) {
    Promise.reject(error);
  }
}

async function fetchRemainingMedical() {
  try {
    let remaining = {};
    const fetchRemaining = await medicalWelfareService.getRemaining({ createFor: model.value.createFor });
    const accidentData = fetchRemaining.data?.datas[0];
    if (accidentData.requestsRemaining != null && !isNaN(Number(accidentData.requestsRemaining))) {
      remaining.requestsRemaining = formatNumber(accidentData.requestsRemaining);
    }
    if (accidentData.fundRemaining != null && !isNaN(Number(accidentData.fundRemaining))) {
      remaining.fundRemaining = formatNumber(accidentData.fundRemaining);
    }
    if (accidentData.perTimesRemaining != null && !isNaN(Number(accidentData.perTimesRemaining))) {
      remaining.perTimesRemaining = formatNumber(accidentData.perTimesRemaining);
    }
    if (accidentData?.subCategoriesName != null) {
      remaining.categoryName = accidentData?.subCategoriesName;
    }
    remaining.src = medicalImage;
    remainingAll.value.push(remaining);
  }
  catch (error) {
    Promise.reject(error);
  }
}
async function fetchRemainingVarious() {
  try {
    const fetchRemaining = await variousWelfareService.getRemaining({ createFor: model.value.createFor });

    if (Array.isArray(fetchRemaining.data?.datas)) {
      const marriageData = fetchRemaining.data.datas.find(item => item.categoryName === "สวัสดิการค่าสงเคราะห์การสมรสโดยนิตินัย");

      if (marriageData) {
        let remaining = {
          categoryName: marriageData.categoryName,
          fundRemaining: marriageData.fundRemaining ? formatNumber(marriageData.fundRemaining) : null,
          perTimesRemaining: marriageData.perTimesRemaining ? formatNumber(marriageData.perTimesRemaining) : null,
          perUsersRemaining: marriageData.perUsersRemaining !== null && marriageData.perUsersRemaining !== undefined
            ? formatNumber(marriageData.perUsersRemaining)
            : null,
          requestsRemaining: marriageData.requestsRemaining !== null && marriageData.requestsRemaining !== undefined
            ? formatNumber(marriageData.requestsRemaining)
            : null,
          src: marriageImage
        };

        remainingAll.value.push(remaining);
      }
    }
  } catch (error) {
    console.error("Error fetching various welfare:", error);
    return Promise.reject(error);
  }
}


async function init() {
  pagination.value.rowsPerPage = listStore.getState();
  if (authStore.isEditor) await tableRef.value.requestServerInteraction();
  await fetchRemainingHealthCheckup(),
  await fetchRemainingDental(),
  await fetchRemainingMedical(),
  await fetchRemainingVarious(),
  await Promise.all([
    fetchFile()
  ]);
}

async function fetchFile() {
  try {
    const getFile = await HomeService.getName();
    file.value = getFile.data?.files ?? [];

    if (Array.isArray(file.value)) {
      fileFetch.value = [];
      fileFetch.value.url = [];
      for (let fileName of file.value) {
        const res = await HomeService.getByName({ fileName: fileName });

        const blob = new Blob([res.data], { type: res.headers["content-type"] });

        if (!(blob instanceof Blob)) {
          throw new Error('Response is not a valid Blob');
        }

        const contentDisposition = res.headers["content-disposition"];

        const matches = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        let fileNameFromAPI = fileName.replace(/^\d+-/, "");

        if (matches && matches[1]) {
          fileNameFromAPI = decodeURIComponent(matches[1]);
        }

        blob.lastModifiedDate = new Date();
        blob.name = fileNameFromAPI;

        fileFetch.value.push(new File([blob], blob.name, { type: blob.type }));
        fileFetch.value.url.push(URL.createObjectURL(blob));
      }
    }
  } catch (error) {
    Promise.reject(error);
  }
}

function triggerFileUpload() {
  fileInput.value.click();
};
function handleFileChange(event) {
  const files = event.target.files;
  if (files.length > 0) {
    fileUpload.value = files;
    for (let i = 0; i < files.length; i++) {
      file.value.push(files[i].name);
    }
  }
};

async function uploadFiles(files) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  const uploadFile = await HomeService.upload(formData);
  if (uploadFile.status === 200) {
    return true;
  }
  return false;
}

function removeFile(name, index) {
  fileDelete.value.push(name);
  file.value.splice(index, 1);
}

async function deleteFile(payload) {
  const deleteFile = await HomeService.delete(payload);
  if (deleteFile.status === 200) {
    return true;
  }
  return false;
}

async function saveFileChanged() {
  let isValid = false;
  Swal.fire({
    title: "ยืนยันการทำรายการหรือไม่ ???",
    html: `โปรดตรวจสอบข้อมูลให้แน่ใจก่อนยืนยัน`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    showLoaderOnConfirm: true,
    reverseButtons: true,
    customClass: {
      confirmButton: "save-button",
      cancelButton: "cancel-button",
    },
    preConfirm: async () => {
      try {
        isLoadingFile.value = true;
        if (fileUpload.value.length > 0) {
          const canUpload = await uploadFiles(fileUpload.value);
          if (!canUpload) {
            throw new Error('ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองอีกครั้ง');
          }
        }

        if (fileDelete.value.length > 0) {
          const canDelete = await deleteFile(fileDelete.value);
          if (!canDelete) {
            throw new Error('ไม่สามารถลบไฟล์ได้ กรุณาลองอีกครั้ง');
          }
        }
        isValid = true;
      } catch (error) {
        Swal.fire({
          html: error?.response?.data?.message ?? `เกิดข้อผิดพลาดกรุณาลองอีกครั้ง`,
          icon: "error",
          confirmButtonText: "ตกลง",
          customClass: {
            confirmButton: "save-button",
          },
        }).then(() => {
          location.reload();
          isLoadingFile.value = false;
        });
      }
    },
  }).then((result) => {
    if (isValid && result.isConfirmed) {
      Swal.fire({
        html: `สำเร็จ`,
        icon: "success",
        confirmButtonText: "ตกลง",
        customClass: {
          confirmButton: "save-button",
        },
      }).then(() => {
        // Reload the page after the user clicks confirm
        location.reload();
        isLoadingFile.value = false;
      });
    }
  });
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
        "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
      position: "bottom-left",
      type: "negative",
    });
  }
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

function goto(requestId, categoryName, welfareType) {
  if (categoryName == "ตรวจสุขภาพ") {
    router.push({
      name: "financial_health_check_up_welfare_edit",
      params: { id: requestId },
    });
  }
  else if (categoryName == "กรณีเจ็บป่วย") {
    router.push({
      name: "financial_medical_welfare_edit",
      params: { id: requestId },
    });
  }
  else if (categoryName == "ทำฟัน") {
    router.push({
      name: "financial_dental_welfare_edit",
      params: { id: requestId },
    });
  }
  else if (welfareType == "สวัสดิการค่าสงเคราะห์ต่าง ๆ") {
    if (categoryName == "เสียชีวิตคนในครอบครัว") {
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
    if (categoryName == "เสียชีวิตคนในครอบครัว") {
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

const pagination = ref({
  sortBy: "desc",
  descending: false,
  page: 1,
  rowsPerPage: 5,
});
const model = ref([]);
const columns = [
  { name: "index", label: "ลำดับ", align: "left", field: "index" },
  { name: "reimNumber", label: "เลขที่ใบเบิก", align: "left", field: (row) => row.reimNumber ?? "-" },
  { name: "createdBy", label: "ผู้ร้องขอ", align: "left", field: (row) => row.createdByName ?? "-" },
  { name: "sendDate", label: "วันที่ส่งใบเบิก", align: "left", field: (row) => row.requestDate ?? "-" },
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


</script>

<style scoped>
.border-card {
  border-radius: 25px;
  overflow: hidden;
}

.border-button {
  border-radius: 15px;

}

.border-button-edit {
  border-radius: 10px;
  padding: 0px 16px;

}

.dental-image {
  width: 100px;
  /* กำหนดขนาดรูปภาพ */
  height: auto;
}

.btn-delete-file {
  padding: 10px 0px;
}

/* .regulation-name{
  max-width: 13em;
} */

@media (min-width: 1440px) and (max-width: 1900px) {
  .regulation-name {
    max-width: 13em;
  }
}

@media (max-width: 533px) {
  .regulation-name {
    max-width: 13em;
  }
}
</style>
