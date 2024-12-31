import { extname } from 'path';

export const editFileName = (req: any, file: any, callback: any) => {
    const name = file.originalname.split('.')[0];
    const fileExtName = extname(file.originalname);
    const randomName = new Date().getTime();
    callback(null, `${name}-${randomName}${fileExtName}`);
};

export const imageFileFilter = (req: any, file: any, callback: any) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|docx|xlsx|pptx)$/)) {
        return callback(new Error('Please upload a valid image'), false);
    }
    if (file.size > 1024 * 1024 * 5) {
        // 5MB
        return callback(new Error('Please upload a file smaller than 5MB'), false);
    }
    callback(null, true);
};
