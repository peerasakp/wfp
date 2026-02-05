<template>
  <PageLayout title="เบิกสวัสดิการค่าสงเคราะห์ต่าง ๆ">
    <template v-slot:page>
      <!--General Information Section -->
      <div class="row q-col-gutter-md q-pl-md q-pt-md">
        <div :class="{ 'col-12': isView || isLoading, 'col-md-9 col-12': !isView && !isLoading }">
          <q-card flat bordered class="full-height">
            <q-card-section class="font-18 font-bold">
              <p class="q-mb-none">ข้อมูลผู้เบิกสวัสดิการ</p>
            </q-card-section>
            <q-separator />
            <q-card-section class="row wrap q-col-gutter-y-md q-pb-sm font-16 font-bold">
              <div class="col-lg-5 col-12 col-xl-4 row q-gutter-y-md q-pr-sm">
                <p class="col-auto q-mb-none">
                  ชื่อ-นามสกุล : <span class="font-medium font-16 text-grey-7">{{
                    userData?.name ?? "-" }}</span>
                </p>
              </div>
              <p class="col-lg-3 col-xl-4 col-12 q-mb-none q-pr-sm text-no-wrap ellipsis"
                :title="userData?.position ?? '-'">
                ตำแหน่ง : <span class="font-medium font-16 text-grey-7">{{
                  userData?.position ?? "-" }}</span>
              </p>
              <p class="col-lg col-xl-4 col-12 q-mb-none text-no-wrap ellipsis" :title="userData?.employeeType ?? '-'">
                ประเภทบุคลากร : <span class="font-medium font-16 text-grey-7">{{
                  userData?.employeeType ?? "-" }}</span>
              </p>
              <p class="col-lg-5 col-xl-4 col-12 q-mb-none q-pr-sm">ส่วนงาน : <span
                  class="font-medium font-16 text-grey-7">{{
                    userData?.department ?? "-" }}</span></p>
              <p class="col-lg col-xl-4 col-12 q-mb-none q-pr-sm">ภาควิชา : <span
                  class="font-medium font-16 text-grey-7">{{
                    userData?.sector ?? "-" }}</span>
              </p>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-3 col-12" v-if="!isView && !isLoading">
          <q-card flat bordered class="full-height">
            <q-card-section class="q-px-md q-py-md font-18 font-bold">
              <p class="q-mb-none">สิทธิ์คงเหลือ</p>
            </q-card-section>
            <q-separator />
            <q-card-section class="row wrap q-col-gutter-y-md q-px-md q-py-md font-medium font-16 text-grey-7">
              <p class="col-12 q-mb-none">
                {{ remainingTextOneForUsers (remaining[4], remaining[4]?.categoryName) }}
              </p>
              <p class="col-12 q-mb-none">
                {{ remainingTextOneForUsers (remaining[5], remaining[5]?.categoryName) }}
              </p>
              <p class="col-12 q-mb-none">
                {{ remainingText(remaining[6], remaining[6]?.categoryName) }}
              </p>
              <p class="col-12 q-mb-none">
                {{ remainingText(remaining[7], remaining[7]?.categoryName) }}
              </p>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <!-- Request Section -->
      <div class="row q-col-gutter-md q-pl-md q-pt-md">
        <div class="col-md-9 col-12">
          <q-card flat bordered class="full-height">
            <q-card-section class="flex justify-between q-px-md q-pt-md q-pb-md font-18 font-bold">
              <p class="q-mb-none">ข้อมูลการเบิกสวัสดิการ</p>
              <a class="q-mb-none font-regular font-16 text-blue-7 cursor-pointer"
                v-if="isView && (model.status == 'รอตรวจสอบ')" @click.stop.prevent="
                  downloadData()">
                <q-icon :name="outlinedDownload" />
                <span> Export</span>
              </a>
            </q-card-section>
            <q-card-section v-show="isView || isEdit" class="row wrap font-medium q-pb-xs font-16 text-grey-9">
              <p class="col-md-4 col-12 q-mb-none">เลขที่ใบเบิก : {{ model.reimNumber ?? "-" }}</p>
              <p class="col-md-4 col-12 q-mb-none">วันที่ร้องขอ : {{ formatDateThaiSlash(model.requestDate) ?? "-" }}
              </p>
              <p class="col-md-4 col-12 q-mb-none">สถานะ : <span :class="textStatusColor(model.status)">{{ model.status
                ?? "-"
              }}</span> </p>
            </q-card-section>
            <q-card-section class="row wrap q-col-gutter-y-md q-px-md q-py-md font-medium font-16 text-grey-9">
              <p class="col-12 q-mb-none">การเบิกสวัสดิการค่าสงเคราะห์ เนื่องในโอกาสต่างๆ</p>
              <div class="col-lg-6 col-12 q-mb-none">
                <q-option-group class="q-gutter-y-sm" v-model="model.categoryId" type="radio" :options="categoryOptions"
                  :disable="isView" :rules="[(val) => !!val || '']" />
              </div>
              <div class="col-5 row q-col-gutter-y-md q-pl-md q-mb-none" style="padding-top: 22px;">
                <p class="col-12 q-mb-none">({{ remaining[4]?.fund ? "จ่ายไม่เกินคนละ " + remaining[4]?.fund + " บาท" :
                  "ไม่จำกัดจำนวนเงินต่อปี" }})</p>
                <p class="col-12 q-mb-none">({{ remaining[5]?.fund ? "จ่ายไม่เกินคนละ " + remaining[5]?.fund + " บาท" :
                  "ไม่จำกัดจำนวนเงินต่อปี" }})</p>
                <p class="col-12 q-mb-none">({{ remaining[6]?.fund ? "จ่ายไม่เกินคนละ " + remaining[6]?.fund + " บาท" :
                  "ไม่จำกัดจำนวนเงินต่อปี" }})</p>
                <p class="col-12 q-mb-none">({{ remaining[7]?.fund ? "จ่ายไม่เกินคนละ " + remaining[7]?.fund + " บาท" :
                  "ไม่จำกัดจำนวนเงินต่อปี" }})</p>
              </div>
            </q-card-section>
            <q-card-section class="row wrap font-medium font-16 text-grey-9 q-pt-none">
              <div class="col-lg-4 col-12 ">
                <InputGroup for-id="fund" is-dense v-model="model.fundReceipt" :data="model.fundReceipt ?? '-'"
                  is-require label="จำนวนเงินตามใบสำคัญรับเงิน (บาท)" placeholder="บาท" type="number" class=""
                  :is-view="isView" :rules="[(val) => !!val || 'กรุณากรอกข้อมูลจำนวนเงินตามใบสำคัญรับเงิน']"
                  :error-message="isError?.fundReceipt" :error="!!isError?.fundReceipt">
                </InputGroup>
              </div>
              <div class="col-lg-2"></div>
              <div class="col-lg-4 col-12 ">
                <InputGroup for-id="fund" is-dense v-model="model.fundEligible" :data="model.fundEligible ?? '-'"
                  is-require label="จำนวนเงินที่ต้องการเบิก (บาท)" placeholder="บาท" type="number"
                  class="q-py-xs-md q-py-lg-none" :is-view="isView" :rules="[
                    (val) => !!val || 'กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก',
                    (val) => !isOver || 'จำนวนเงินที่ต้องการเบิกห้ามมากว่าจำนวนเงินตามใบเสร็จ',
                    (val) => isOverfundRemaining !== 2 || 'จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้',
                    (val) => isOverfundRemaining !== 1 || 'สามารถเบิกได้สูงสุด ' + remaining.perTimesRemaining + ' บาทต่อครั้ง',
                    (val) => isOverfundRemaining !== 3 || 'คุณใช้จำนวนการเบิกครบแล้ว'
                  ]" :error-message="isError?.fundEligible" :error="!!isError?.fundEligible">
                </InputGroup>

              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-3 col-12">
          <q-card flat bordered>
            <q-card-section class="q-px-md q-pt-md q-pb-md font-18 font-bold">
              <p class="q-mb-none">หลักฐานที่ต้องแนบ</p>
            </q-card-section>
            <q-separator />
            <q-card-section class="row wrap q-col-gutter-y-md q-px-md q-py-md font-medium font-16 text-grey-7">
              <!-- File Receipt -->
              <div class="col-12">
                <p class="q-mb-xs">1. ใบสำคัญรับเงิน</p>
                <div v-if="model.fileReceipt" class="row items-center q-gutter-sm">
                  <q-chip color="primary" text-color="white" class="q-mb-none"
                    :label="getFileName(model.fileReceipt)" />
                  <q-btn flat round dense size="sm" icon="visibility" @click="previewFile(model.fileReceipt)" />
                  <q-btn flat round dense size="sm" icon="download" @click="downloadFile(model.fileReceipt)" />
                </div>
                <p v-else class="q-mb-none text-grey-5">- ไม่มีไฟล์ -</p>
              </div>
              <!-- File Document -->
              <div class="col-12">
                <p class="q-mb-xs">2. {{ getDocumentLabel() }}</p>
                <div v-if="model.fileDocument" class="row items-center q-gutter-sm">
                  <q-chip color="primary" text-color="white" class="q-mb-none"
                    :label="getFileName(model.fileDocument)" />
                  <q-btn flat round dense size="sm" icon="visibility" @click="previewFile(model.fileDocument)" />
                  <q-btn flat round dense size="sm" icon="download" @click="downloadFile(model.fileDocument)" />
                </div>
                <p v-else class="q-mb-none text-grey-5">- ไม่มีไฟล์ -</p>
              </div>
              <!-- File Photo - Only for disaster (category 7) -->
              <div class="col-12" v-if="model.categoryId === 7">
                <p class="q-mb-xs">3. รูปภาพ</p>
                <div v-if="model.filePhoto" class="row items-center q-gutter-sm">
                  <q-chip color="primary" text-color="white" class="q-mb-none"
                    :label="getFileName(model.filePhoto)" />
                  <q-btn flat round dense size="sm" icon="visibility" @click="previewFile(model.filePhoto)" />
                  <q-btn flat round dense size="sm" icon="download" @click="downloadFile(model.filePhoto)" />
                </div>
                <p v-else class="q-mb-none text-grey-5">- ไม่มีไฟล์ -</p>
              </div>
              <!-- File House Registration - Only for disaster (category 7) -->
              <div class="col-12" v-if="model.categoryId === 7">
                <p class="q-mb-xs">4. สำเนาทะเบียนบ้าน</p>
                <div v-if="model.fileHouseRegistration" class="row items-center q-gutter-sm">
                  <q-chip color="primary" text-color="white" class="q-mb-none"
                    :label="getFileName(model.fileHouseRegistration)" />
                  <q-btn flat round dense size="sm" icon="visibility" @click="previewFile(model.fileHouseRegistration)" />
                  <q-btn flat round dense size="sm" icon="download" @click="downloadFile(model.fileHouseRegistration)" />
                </div>
                <p v-else class="q-mb-none text-grey-5">- ไม่มีไฟล์ -</p>
              </div>
            </q-card-section>
          </q-card>


        </div>
      </div>
    </template>
    <!-- File Preview Dialog -->
    <q-dialog v-model="showPreviewDialog" maximized>
      <q-card class="full-width full-height">
        <q-bar class="bg-primary text-white">
          <div class="text-weight-bold">{{ previewFileName }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>
        <q-card-section class="full-height q-pa-none">
          <iframe v-if="previewType === 'pdf'" :src="previewUrl" class="full-width full-height" style="border: none;"></iframe>
          <div v-else class="flex flex-center full-height">
            <img :src="previewUrl" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
      </div>
    </template>
    <!--Action Slot -->
    <template v-slot:action>
      <div class="justify-end row q-py-xs font-medium q-gutter-lg">
        <q-btn id="button-back" class="text-white font-medium font-16 weight-8 q-px-lg" dense type="button"
          style="background : #BFBFBF;" label="ย้อนกลับ" no-caps :to="{ name: 'welfare_management_list' }" />
        <q-btn :disable="isButtonDisabled || isValidate" id="button-draft"
          class="text-white font-medium bg-blue-9 text-white font-16 weight-8 q-px-lg" dense type="submit"
          label="บันทึก" no-caps @click="submit()" v-if="!isView && !isLoading" />
        <q-btn id="button-approve"
        class="font-medium font-16 weight-8 text-white q-px-md" dense type="submit" style="background-color: #E52020"
        label="ไม่อนุมัติ" no-caps @click="submit(4)" v-if="!isView && !isLoading" />
        <q-btn :disable="isButtonDisabled || isValidate" id="button-approve"
          class="font-medium font-16 weight-8 text-white q-px-md" dense type="submit" style="background-color: #43a047"
          label="อนุมัติ" no-caps @click="submit(3)" v-if="!isView && !isLoading" />
      </div>
    </template>
  </PageLayout>
</template>
<script setup>
import PageLayout from "src/layouts/PageLayout.vue";
import InputGroup from "src/components/InputGroup.vue";
import Swal from "sweetalert2";
import { Notify } from "quasar";
import { formatDateThaiSlash, formatNumber } from "src/components/format";
import userManagementService from "src/boot/service/userManagementService";
import { outlinedDownload } from "@quasar/extras/material-icons-outlined";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "src/stores/authStore";
import variousWelfareService from "src/boot/service/variousWelfareService";
import exportService from "src/boot/service/exportService";
import { textStatusColor } from "src/components/status";
import { remainingText, remainingTextOneForUsers } from "src/components/remaining";
import welfareManagementService from "src/boot/service/welfareManagementService";

defineOptions({
  name: "various_welfare_edit",
});
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const model = ref({
  fundReceipt: null,
  fundEligible: null,
  categoryId: null,
  createFor: null,
  fileReceipt: null,
  fileDocument: null,
  filePhoto: null,
  fileHouseRegistration: null,
});

// File preview state
const showPreviewDialog = ref(false);
const previewUrl = ref('');
const previewType = ref('');
const previewFileName = ref('');
let options = ref([]);
const categoryOptions =
  [
  {
      label: 'สวัสดิการค่าสงเคราะห์การสมรสโดยนิตินัย',
      value: 4
    },
    {
      label: 'สวัสดิการค่าสงเคราะห์การอุปสมบทหรือการไปประกอบพิธีฮัจญ์',
      value: 5
    },
    {
      label: 'สวัสดิการค่าสงเคราะห์การเบิกค่ารับขวัญบุตรแรกเกิด',
      value: 6
    },
    {
      label: 'สวัสดิการค่าสงเคราะห์การเบิกสวัสดิการค่าสงเคราะห์ กรณีประสบภัยพิบัติ',
      value: 7
    }
  ]

const isFetch = ref(false);
const userData = ref({});
const remaining = ref({});
const isLoading = ref(false);
const isError = ref({});
const canRequest = ref(false);
const isView = ref(false);
const userInitialData = ref([]);
const isEdit = computed(() => {
  return !isNaN(route.params.id);
});
const isFetchRemaining = ref(false);

onMounted(async () => {
  await init();
  isLoading.value = false;
});

onBeforeUnmount(() => {
  model.value = null;
});
const isButtonDisabled = computed(() => {
  return !remaining.value[model.value.categoryId]?.canRequest;
});

watch(
  () => model.value.categoryId,
  (newValue) => {
    if (newValue !== null && !isFetch.value) {
      isError.value = {};
      model.value.fundEligible = null;
      model.value.fundReceipt = null;

    }
    isFetch.value = false;
  }
);
watch(
  () => model.value.createFor,
  async (newValue) => {
    if (newValue !== null) {
      await fetchRemaining();
    }
  }
);
const isValidate = computed(() => {
  let validate = false;
  if (!model.value.categoryId) {
    validate = true;
  }
  if (!model.value.fundReceipt) {
    validate = true;
  }
  if (!model.value.fundEligible) {
    validate = true;
  }
  if (isOverfundRemaining.value) {
    validate = true;
  }
  if (!model.value.createFor) {
    validate = true;
  }
  return validate;
});

const isOver = computed(() => {
  return Number(model.value.fundEligible) > Number(model.value.fundReceipt);
});

const isOverfundRemaining = computed(() => {
  const fundSumRequest = Number(model.value.fundEligible ?? 0);
  const categoryData = remaining.value[model.value.categoryId] || {};

  const perTimes = categoryData.perTimesRemaining ? parseFloat(categoryData.perTimesRemaining.replace(/,/g, "")) : null;
  const fundRemaining = categoryData.fundRemaining ? parseFloat(categoryData.fundRemaining.replace(/,/g, "")) : null;
  const canRequest = categoryData.canRequest ?? true;
  let check = false;
  if (Number(fundSumRequest) > perTimes && categoryData.perTimesRemaining) {
    check = 1;
  }
  if (Number(fundSumRequest) > fundRemaining && categoryData.fundRemaining) {
    check = 2;
  } if (!canRequest && isFetchRemaining.value) {
    check = 3;
  }
  return check;
});


async function fetchDataEdit() {
  setTimeout(async () => {
    try {
      const result = await welfareManagementService.dataVariousById(route.params.id);
      var returnedData = result.data.datas;
      if (returnedData) {
        model.value = {
          ...model.value,
          createFor: returnedData?.user.userId,
          reimNumber: returnedData?.reimNumber,
          requestDate: returnedData?.requestDate,
          status: returnedData?.status,
          fundReceipt: returnedData?.fundReceipt,
          fundEligible: returnedData?.fundEligible,
          fundSumRequest: returnedData?.fundSumRequest,
          categoryId: returnedData?.categoryId,
          fileReceipt: returnedData?.fileReceipt,
          fileDocument: returnedData?.fileDocument,
          filePhoto: returnedData?.filePhoto,
          fileHouseRegistration: returnedData?.fileHouseRegistration,
        };
        userData.value = {
          name: returnedData?.user.name,
          position: returnedData?.user.position,
          employeeType: returnedData?.user.employeeType,
          sector: returnedData?.user.sector,
          department: returnedData?.user.department,
        };
      }
      isFetch.value = true;
    } catch (error) {
      router.replace({ name: "welfare_management_list" });
      Notify.create({
        message:
          error?.response?.data?.message ??
          "เกิดข้อผิดพลาดกรุณาลองอีกครั้ง",
        position: "bottom-left",
        type: "negative",
      });
    }
    isLoading.value = false;
  }, 100);
}
async function fetchUserData(id) {
  try {
    const result = await userManagementService.dataById(id);
    var returnedData = result.data.datas;
    if (returnedData) {
      userData.value = {
        name: returnedData?.name,
        position: returnedData?.position.name,
        employeeType: returnedData?.employeeType.name,
        sector: returnedData?.sector.name,
        department: returnedData?.department.name,
      };
    }
  }
  catch (error) {
    Promise.reject(error);
  }
}
async function fetchRemaining() {
  try {
    const fetchRemaining = await variousWelfareService.getRemaining({ createFor: model.value.createFor });
    if (Array.isArray(fetchRemaining.data?.datas)) {
      fetchRemaining.data.datas.forEach((item) => {
        remaining.value[item.categoryId] = { ...item };

        if (item.fundRemaining !== null && !isNaN(Number(item.fundRemaining))) {
          remaining.value[item.categoryId].fundRemaining = formatNumber(item.fundRemaining);
        }
        if (item.perTimesRemaining !== null && !isNaN(Number(item.perTimesRemaining))) {
          remaining.value[item.categoryId].perTimesRemaining = formatNumber(item.perTimesRemaining);
        }
        if (item.requestsRemaining !== null && !isNaN(Number(item.requestsRemaining))) {
          remaining.value[item.categoryId].requestsRemaining = formatNumber(item.requestsRemaining);
        }
        if (item.fund !== null && !isNaN(Number(item.fund))) {
          remaining.value[item.categoryId].fund = formatNumber(item.fund);
        }
        if (item.perUsersRemaining !== null && !isNaN(Number(item.perUsersRemaining))) {
          remaining.value[item.categoryId].perUsersRemaining = formatNumber(item.perUsersRemaining);
        }
      });

      if (Array.isArray(fetchRemaining.data?.datas)) {
        canRequest.value = fetchRemaining.data.datas.some(item => item.canRequest === true);

      } else {
        canRequest.value = false;
      }

    }
    isFetchRemaining.value = true;
  } catch (error) {
    Promise.reject(error);
  }
}

async function downloadData() {
  const notify = Notify.create({
    message: "กรุณารอสักครู่ ระบบกำลังทำการดาวน์โหลด",
    position: "top-right",
    spinner: true,
    type: 'info',
  });
  try {
    const result = await exportService.various(route.params.id);
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
    console.log(error);
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

// File handling functions
function getFileName(filePath) {
  if (!filePath) return '';
  const parts = filePath.split('-');
  if (parts.length > 1) {
    return parts.slice(1).join('-');
  }
  return filePath;
}

function getFileType(filePath) {
  if (!filePath) return '';
  const ext = filePath.split('.').pop().toLowerCase();
  return ext;
}

function getDocumentLabel() {
  switch (model.value.categoryId) {
    case 4: return 'สำเนาทะเบียนสมรส';
    case 5: return 'สำเนาคำสั่งลาอุปสมบท หรือเอกสารประกอบพิธีฮัจญ์';
    case 6: return 'สำเนาสูติบัตรบุตร หรือสำเนาทะเบียนรับรองบุตร';
    case 7: return 'เอกสารประกอบ';
    default: return 'เอกสาร';
  }
}

async function previewFile(fileName) {
  try {
    const response = await variousWelfareService.getFile(fileName);
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    previewUrl.value = URL.createObjectURL(blob);
    previewFileName.value = getFileName(fileName);
    previewType.value = getFileType(fileName) === 'pdf' ? 'pdf' : 'image';
    showPreviewDialog.value = true;
  } catch (error) {
    Notify.create({
      message: 'ไม่สามารถโหลดไฟล์ได้',
      position: 'bottom-left',
      type: 'negative',
    });
  }
}

async function downloadFile(fileName) {
  try {
    const response = await variousWelfareService.getFile(fileName);
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    Notify.create({
      message: 'ไม่สามารถดาวน์โหลดไฟล์ได้',
      position: 'bottom-left',
      type: 'negative',
    });
  }
}

async function submit(actionId) {
  let validate = false;
  if (!model.value.fundReceipt) {
    isError.value.fundReceipt = "กรุณากรอกข้อมูลจำนวนเงินตามใบสำคัญรับเงิน";
    let navigate = document.getElementById("fund");
    window.location.hash = "fund";
    navigate.scrollIntoView(false);
    validate = true;
  }
  if (isOverfundRemaining.value) {
    if (isOverfundRemaining.value === 2) {
      isError.value.fundEligible = "จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้";
    }
    else if (isOverfundRemaining.value === 1) {
      isError.value.fundEligible = "สามารถเบิกได้สูงสุด " + remaining.value.perTimesRemaining + " บาทต่อครั้ง";
    }
    else {
      isError.value.fundEligible = "คุณใช้จำนวนการเบิกครบแล้ว";
    }
    validate = true;
  }
  if (isOver.value) {
    isError.value.fundEligible = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิกให้น้อยกว่าหรือเท่ากับจำนวนเงินตามใบสำคัญรับเงิน";
    validate = true;
  }
  if (validate === true && actionId != 4) {
    Notify.create({
      message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      position: "bottom-left",
      type: "negative",
    });
    return;
  }
  let isValid = false;
  let payload = {
    fundReceipt: Number(model.value.fundReceipt),
    fundEligible: Number(model.value.fundEligible),
    categoryId: model.value.categoryId,
    actionId: actionId,
  }
  var fetch;
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
        if (isEdit.value) {
          fetch = await welfareManagementService.updateVarious(route.params.id, payload);
        }
        else {
          fetch = await variousWelfareService.create(payload);
        }
        isValid = true;
      } catch (error) {
        if (error?.response?.status == 400) {
          if (Object.keys(error?.response?.data?.errors ?? {}).length) {
            isError.value = {
              ...isError.value,
              ...error.response?.data?.errors,
            };
          }
        }
        Swal.fire({
          html: error?.response?.data?.message ?? `เกิดข้อผิดพลาดกรุณาลองอีกครั้ง`,
          icon: "error",
          confirmButtonText: "ตกลง",
          customClass: {
            confirmButton: "save-button",
          },
        });
      }
    },
  }).then((result) => {
    if (isValid && result.isConfirmed) {
      Swal.fire({
        html: fetch.data?.message ?? `สำเร็จ`,
        icon: "success",
        confirmButtonText: "ตกลง",
        customClass: {
          confirmButton: "save-button",
        },
      }).then(() => {
        router.replace({ name: "welfare_management_list" });
      });
    }
  });
}
async function init() {
  isView.value = route.meta.isView;
  isLoading.value = true;
  try {
    if (isView.value) {
      await fetchDataEdit();
      await fetchRemaining();
    }
    else if (isEdit.value) {
      fetchRemaining();
      const result = await userManagementService.getUserInitialData({ keyword: null });
      userInitialData.value = result.data.datas;
      options.value = result.data.datas;
      fetchDataEdit();
    }
    else {
      fetchRemaining();
      fetchUserData(authStore.id);
      const result = await userManagementService.getUserInitialData({ keyword: null });
      userInitialData.value = result.data.datas;
    }
  }
  catch (error) {
    Promise.reject(error);
  }
  isLoading.value = false;
}
</script>
