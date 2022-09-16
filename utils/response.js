//错误信息响应代码
export const SUCCESS_200 = 200;
export const SUCCESS_201 = 201;

export const ERROR_400 = 400;
export const ERROR_401 = 401;
export const ERROR_403 = 403;
export const ERROR_404 = 404;

export const ERROR_500 = 500;

export const LOGOUT_SUCCESS = '注销成功';
export const FILE_CREATED = '文件上传成功';

//错误信息响应
export const QUERY_REJECT_DATA_ERROR = '该序列号已经放行，无需重复放行!';
export const DATABASE_NO_AFFECT_ROWS_ERROR = '执行操作的数据信息不存在！';
export const USER_AUTH_ERROR = '用户名或者密码不不正确！';
export const USER_AUTH_DOMAIN_ERROR = '用户名密码域验证失败！';
export const POST_DATA_ERROR = 'POST数据格式不正确！';
export const USER_TOKEN_EMPTY = '验证Token不能为空！';
export const USER_NAME_ERROR = '用户名或者密码不能为空！';
export const USER_ID_ERROR = '用户名ID不能为空！';
export const NO_WORK_NUMBER_ITEMS_DATA = '当前没有待处理工单信息！';
export const TOKEN_INVALIDATE_ERROR = '用户Token已失效,请重新登录！';
export const UPLOAD_DATA_EMPTY_ERROR = '上传数据不能为空';
export const FILE_REJECTD = '打印失败，连接Bartender数据库失败';
export const FILE_BAD_TYPE = '文件类型不正确';
export const FILE_BAD_CONTENT = '文件内容不正确';
export const MASTER_NOT_FULL_MATCHED = '存在未匹配到的序列号';
export const WORK_NUMBER_RELEASE_ERROR = '工单数据更新失败';
export const PARAMETER_ERROR = '参数有误';
export const MATERIAL_NUMBER_ERROR = '物料号格式有误，无法生成序列号';
export const SERIAL_EXISTED = "生成失败，条码有重复";
export const WORK_NUMBER_NOTEXISTED = "工单不存在，请检查";
export const HANA_GENERAL_ERROR = "连接HANA服务失败，请稍后再试";
export const HANA_MATERIAL_DOCUMENT_ERROR = "创建物料凭证失败，请稍后再试";
export const HANA_CSRF_ERROR = "HANA Token失效，请稍后再试";
export const SERIAL_DUP_ISSUED = "该序列号已经投料，请勿重复投料！";

//主数据相关错误信息
export const MASTER_DATA_QUERY_ID_ERROR = '查询参数不能为空！';