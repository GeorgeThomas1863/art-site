import { buildContactParams } from "../util/params.js";
import { sendToBack } from "../util/api-front.js";

export const runContactSubmit = async () => {
    const contactParams = await buildContactParams();

    const data = await sendToBack(contactParams);
    console.log("CONTACT DATA:");
    console.dir(data);
};
