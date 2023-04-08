
import { PythonV2FunctionProjectParser } from '../core/pythonV2FunctionProjectParser';
import { FunctionsMap } from '../core/FunctionsMap';

class PythonV2FunctionProjectParserAccessor extends PythonV2FunctionProjectParser {

    constructor() {
        super(undefined as any, undefined as any);
    }

    public traverseFunctions(projectFolder: string): Promise<FunctionsMap> {
        throw new Error('Method not implemented.');
    }
    protected getFunctionsAndTheirCodesAsync(functionNames: string[], hostJsonFolder: string): Promise<{ name: string; code: string; filePath: string; pos: number; lineNr: number; }[]> {
        throw new Error('Method not implemented.');
    }
}

const parser = new PythonV2FunctionProjectParserAccessor() as any;


test('functionAttributeRegex', () => {

    const samples = [

`
from typing import List

import os
from os.path import dirname

import json
import pathlib
import logging

from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import ResourceExistsError

import azure.functions as func
import azure.durable_functions as df

myApp = df.DFApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@myApp.route(route="orchestrators/{functionName}")
@myApp.durable_client_input(client_name="client")
async def HttpStart(req: func.HttpRequest, client):
    payload: str = json.loads(req.get_body().decode()) # Load JSON post request data
    instance_id = await client.start_new(req.route_params["functionName"], client_input=payload)

    logging.info(f"Started orchestration with ID = '{instance_id}'.")

    return client.create_check_status_response(req, instance_id)

@myApp.orchestration_trigger(context_name="context")
def E2_BackupSiteContent(context: df.DurableOrchestrationContext):
    root_directory: str = context.get_input()

    if not root_directory:
        raise Exception("A directory path is required as input")

    files = yield context.call_activity("E2_GetFileList", root_directory)
    tasks = []
    for file in files:
        tasks.append(context.call_activity("E2_CopyFileToBlob", file))
    
    results = yield context.task_all(tasks)
    total_bytes = sum(results)
    return total_bytes

connect_str = os.getenv('AzureWebJobsStorage')

@myApp.activity_trigger(input_name="rootDirectory")
def E2_GetFileList(rootDirectory):
    all_file_paths = []
    # We walk the file system
    for path, _, files in os.walk(rootDirectory):
        # We copy the code for activities and orchestrators
        if "E2_" in path:
            # For each file, we add their full-path to the list
            for name in files:
                if name == "__init__.py" or name == "function.json":
                    file_path = os.path.join(path, name)
                    all_file_paths.append(file_path)
    
    return all_file_paths

@myApp.activity_trigger(input_name="filePath")
def E2_CopyFileToBlob(filePath):
    # Create the BlobServiceClient object which will be used to create a container client
    blob_service_client = BlobServiceClient.from_connection_string(connect_str)
    
    # Create a unique name for the container
    container_name = "backups"
    
    # Create the container if it does not exist
    try:
        blob_service_client.create_container(container_name)
    except ResourceExistsError:
        pass

    # Create a blob client using the local file name as the name for the blob
    parent_dir, fname = pathlib.Path(filePath).parts[-2:] # Get last two path components
    blob_name = parent_dir + "_" + fname
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)

    # Count bytes in file
    byte_count = os.path.getsize(filePath)

    # Upload the created file
    with open(filePath, "rb") as data:
        blob_client.upload_blob(data)

    return byte_count

`,
        
    ];

    const results = [

        ['HttpStart', 'E2_BackupSiteContent', 'E2_GetFileList', 'E2_CopyFileToBlob'],

    ];

    for (var i = 0; i < samples.length; i++) {

        const sample = samples[i];
        const result = results[i];

        const regex = parser.getFunctionAttributeRegex();

        var count = 0;
        var match: RegExpExecArray | null;
        while (!!(match = regex.regex.exec(sample))) {

            expect(match[regex.pos]).toBe(result[count]);

            count++;
        }
    
        expect(count).toBe(result.length);
    }
});

test('getFunctionAttributeRegex', () => {

    const orchId = `_my.orch-123`;

    const samples = [

    ];

    const regex = parser.getStartNewOrchestrationRegex(orchId);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('getStartNewOrchestrationRegex', () => {

    const orchId = `_my.orch-123`;

    const samples = [

    ];

    const regex = parser.getStartNewOrchestrationRegex(orchId);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('getRaiseEventRegex', () => {

    const eventName = `_my.event-123`;

    const samples = [

   ];

    const regex = parser.getRaiseEventRegex(eventName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});

test('waitForExternalEventRegex', () => {

    const eventName = `_my-Event123`;

    const sample = `
    
    `;

    const regex = parser.getWaitForExternalEventRegex();

    var count = 0;
    var match: RegExpExecArray | null;
    while (!!(match = regex.regex.exec(sample))) {
        expect(match[regex.pos]).toBe(eventName);
        count++;
    }

    expect(count).toBe(0);
});

test('getCallActivityRegex', () => {

    const activityName = `_my.activity-123`;

    const samples = [

    ];

    const regex = parser.getCallActivityRegex(activityName);
    for (const sample of samples) {
        expect(regex.exec(sample)).not.toBeNull();
    }
});
